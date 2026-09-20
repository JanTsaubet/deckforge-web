import type { ManaColor } from "@/features/cards/types/card";
import { DECK_FORMAT_LABELS } from "../constants/deck-formats";
import type { CatalogCard, DeckCardLine, DeckFormat } from "../types/deck";
import { isBasicLand } from "./card-category";

export type IssueLevel = "error" | "warning" | "info";

export interface DeckIssue {
  level: IssueLevel;
  message: string;
  /** Cartas afectadas, para resaltarlas en la lista. */
  cardIds?: string[];
}

interface FormatRules {
  /** Tamaño exacto (formatos con comandante) o mínimo del mazo que se juega. */
  deckSize: number;
  exactSize: boolean;
  /** Copias máximas de una carta que no sea tierra básica. */
  maxCopies: number;
  hasCommander: boolean;
  maxSideboard?: number;
}

const COMMANDER_RULES: FormatRules = {
  deckSize: 100,
  exactSize: true,
  maxCopies: 1,
  hasCommander: true,
};
const CONSTRUCTED_RULES: FormatRules = {
  deckSize: 60,
  exactSize: false,
  maxCopies: 4,
  hasCommander: false,
  maxSideboard: 15,
};

const RULES: Record<DeckFormat, FormatRules> = {
  commander: COMMANDER_RULES,
  brawl: { ...COMMANDER_RULES, deckSize: 60 },
  standard: CONSTRUCTED_RULES,
  pioneer: CONSTRUCTED_RULES,
  modern: CONSTRUCTED_RULES,
  legacy: CONSTRUCTED_RULES,
  vintage: CONSTRUCTED_RULES,
  pauper: CONSTRUCTED_RULES,
};

const NUMBER_WORDS: Record<string, number> = { seven: 7, nine: 9 };

/**
 * Cuántas copias admite una carta. Las básicas y las que lo dicen en su texto ("A deck can
 * have any number of cards named…", como Relentless Rats) no tienen límite; alguna tiene uno
 * propio ("up to seven", Seven Dwarves).
 */
export function copyLimit(card: CatalogCard, rules: FormatRules): number {
  if (isBasicLand(card.typeLine)) return Infinity;
  const text = card.oracleText ?? "";
  if (/A deck can have any number of cards named/i.test(text)) return Infinity;
  const upTo = /A deck can have up to (\w+) cards named/i.exec(text)?.[1]?.toLowerCase();
  if (upTo && NUMBER_WORDS[upTo]) return NUMBER_WORDS[upTo];
  return rules.maxCopies;
}

/** ¿Puede ser comandante? Criaturas legendarias, y las que lo dicen en su texto. */
export function canBeCommander(card: CatalogCard): boolean {
  const front = card.typeLine.split(" // ")[0] ?? card.typeLine;
  if (/\bLegendary\b/.test(front) && /\bCreature\b/.test(front)) return true;
  return /can be your commander/i.test(card.oracleText ?? "");
}

/** Habilidades que permiten llevar dos comandantes. */
function allowsPartner(card: CatalogCard): boolean {
  const text = card.oracleText ?? "";
  return (
    /\bPartner\b|Friends forever|Choose a Background|Doctor's companion/i.test(text) ||
    /\bBackground\b/.test(card.typeLine) ||
    /Time Lord Doctor/.test(card.typeLine)
  );
}

/**
 * Comprueba un mazo contra las reglas de su formato. Devuelve problemas de tres niveles:
 *  - **error:** incumple una regla (carta prohibida, fuera de la identidad, copias de más).
 *  - **warning:** todavía no se puede jugar (le faltan cartas, no tiene comandante).
 *  - **info:** datos útiles que no son un problema (Game Changers para el bracket).
 */
export function validateDeck(entries: DeckCardLine[], format: DeckFormat): DeckIssue[] {
  const rules = RULES[format];
  const issues: DeckIssue[] = [];
  const playable = entries.filter((entry) => entry.board === "commander" || entry.board === "main");
  const commanders = entries
    .filter((entry) => entry.board === "commander")
    .map((entry) => entry.card);
  const formatLabel = DECK_FORMAT_LABELS[format];

  // Tamaño.
  const size = playable.reduce((total, entry) => total + entry.quantity, 0);
  if (rules.exactSize && size !== rules.deckSize) {
    issues.push({
      level: size > rules.deckSize ? "error" : "warning",
      message: `El mazo tiene ${size} cartas; en ${formatLabel} lleva exactamente ${rules.deckSize}${rules.hasCommander ? " contando el comandante" : ""}.`,
    });
  } else if (!rules.exactSize && size < rules.deckSize) {
    issues.push({
      level: "warning",
      message: `El mazo tiene ${size} cartas; el mínimo es ${rules.deckSize}.`,
    });
  }
  if (rules.maxSideboard !== undefined) {
    const sideboard = entries
      .filter((entry) => entry.board === "sideboard")
      .reduce((total, entry) => total + entry.quantity, 0);
    if (sideboard > rules.maxSideboard) {
      issues.push({
        level: "error",
        message: `El banquillo tiene ${sideboard} cartas; el máximo es ${rules.maxSideboard}.`,
      });
    }
  }

  // Comandante.
  if (rules.hasCommander) issues.push(...validateCommanders(commanders));
  else if (commanders.length > 0) {
    issues.push({
      level: "error",
      message: `${formatLabel} no tiene comandante: mueve esas cartas al mazo.`,
      cardIds: commanders.map((card) => card.id),
    });
  }

  // Copias, sumando las de todas las zonas que se juegan (y por nombre, no por impresión).
  const copiesByName = new Map<string, { card: CatalogCard; copies: number }>();
  for (const { card, quantity } of playable) {
    const current = copiesByName.get(card.name);
    copiesByName.set(card.name, { card, copies: (current?.copies ?? 0) + quantity });
  }
  const tooMany = [...copiesByName.values()].filter(({ card, copies }) => {
    const limit = card.legalities[format] === "restricted" ? 1 : copyLimit(card, rules);
    return copies > limit;
  });
  if (tooMany.length > 0) {
    issues.push({
      level: "error",
      message:
        rules.maxCopies === 1
          ? `Solo se permite una copia de cada carta: ${names(tooMany.map((item) => item.card))}.`
          : `Más copias de las permitidas: ${names(tooMany.map((item) => item.card))}.`,
      cardIds: tooMany.map((item) => item.card.id),
    });
  }

  // Identidad de color del comandante.
  if (rules.hasCommander && commanders.length > 0) {
    const identity = new Set<ManaColor>(commanders.flatMap((card) => card.colorIdentity));
    const outside = playable
      .filter((entry) => entry.board === "main")
      .map((entry) => entry.card)
      .filter((card) => card.colorIdentity.some((color) => !identity.has(color)));
    if (outside.length > 0) {
      issues.push({
        level: "error",
        message: `Fuera de la identidad de color del comandante: ${names(outside)}.`,
        cardIds: outside.map((card) => card.id),
      });
    }
  }

  // Legalidad (prohibidas y no legales en el formato).
  const cards = uniqueCards(playable.map((entry) => entry.card));
  const banned = cards.filter((card) => card.legalities[format] === "banned");
  const notLegal = cards.filter((card) => card.legalities[format] === "not_legal");
  if (banned.length > 0) {
    issues.push({
      level: "error",
      message: `Prohibidas en ${formatLabel}: ${names(banned)}.`,
      cardIds: banned.map((card) => card.id),
    });
  }
  if (notLegal.length > 0) {
    issues.push({
      level: "error",
      message: `No son legales en ${formatLabel}: ${names(notLegal)}.`,
      cardIds: notLegal.map((card) => card.id),
    });
  }

  // Game Changers: cuentan para el bracket de Commander.
  if (format === "commander") {
    const gameChangers = cards.filter((card) => card.gameChanger);
    if (gameChangers.length > 0) {
      issues.push({
        level: "info",
        message: `${gameChangers.length} Game ${gameChangers.length === 1 ? "Changer" : "Changers"} (cuentan para el bracket): ${names(gameChangers)}.`,
        cardIds: gameChangers.map((card) => card.id),
      });
    }
  }

  return issues;
}

function validateCommanders(commanders: CatalogCard[]): DeckIssue[] {
  if (commanders.length === 0) {
    return [
      { level: "warning", message: "Elige un comandante: fija la identidad de color del mazo." },
    ];
  }
  if (commanders.length > 2) {
    return [
      {
        level: "error",
        message: "Un mazo puede tener como mucho dos comandantes.",
        cardIds: commanders.map((card) => card.id),
      },
    ];
  }

  const issues: DeckIssue[] = [];
  const ineligible = commanders.filter(
    (card) => !canBeCommander(card) && !/\bBackground\b/.test(card.typeLine),
  );
  if (ineligible.length > 0) {
    issues.push({
      level: "error",
      message: `No puede ser comandante (tiene que ser una criatura legendaria): ${names(ineligible)}.`,
      cardIds: ineligible.map((card) => card.id),
    });
  }
  if (commanders.length === 2 && !commanders.every(allowsPartner)) {
    issues.push({
      level: "error",
      message:
        "Dos comandantes solo pueden ir juntos si los dos tienen Partner (o una habilidad parecida).",
      cardIds: commanders.map((card) => card.id),
    });
  }
  return issues;
}

function uniqueCards(cards: CatalogCard[]): CatalogCard[] {
  return [...new Map(cards.map((card) => [card.name, card])).values()];
}

function names(cards: CatalogCard[]): string {
  return cards.map((card) => card.name).join(", ");
}
