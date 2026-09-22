import { MANA_COLOR_ORDER } from "@/features/cards/lib/colors";
import type { ManaColor } from "@/features/cards/types/card";
import type { CatalogCard, DeckCardLine } from "../types/deck";

/** Tierras básicas: el tipo dice qué maná dan, sin mirar el texto. */
const BASIC_LAND_COLORS: Record<string, ManaColor> = {
  Plains: "W",
  Island: "U",
  Swamp: "B",
  Mountain: "R",
  Forest: "G",
};

/**
 * "Add {G}", "Add {W} or {U}", "Add {B}{B}"… Se recoge todo lo que viene detrás de "Add"
 * hasta el final de la frase, porque los símbolos pueden ir encadenados o separados por
 * "or" y por comas.
 */
const ADDS_MANA = /\badd\b([^.;]*)/gi;

/** Cualquier color: "add one mana of any color", "add two mana of any one color"… */
const ANY_COLOR = /\bof any (?:one )?color\b/i;

/**
 * Qué colores de maná puede producir una carta.
 *
 * Se lee de su texto de reglas, que es donde está escrito, con dos atajos: las tierras
 * básicas se reconocen por su tipo, y "de cualquier color" cuenta como los cinco. Es una
 * lectura aproximada —hay cartas que solo producen maná en condiciones muy concretas— pero
 * acierta en lo que llena un mazo: tierras, piedras y criaturas de maná.
 */
export function producedColors(card: CatalogCard): ManaColor[] {
  if (card.typeLine.includes("Land")) {
    // Una tierra puede tener dos tipos básicos (Tropical Island): produce los dos.
    const fromTypes = Object.entries(BASIC_LAND_COLORS)
      .filter(([subtype]) => card.typeLine.includes(subtype))
      .map(([, color]) => color);
    if (fromTypes.length > 0) return MANA_COLOR_ORDER.filter((color) => fromTypes.includes(color));
  }

  const text = card.oracleText;
  if (!text) return [];

  const colors = new Set<ManaColor>();
  for (const [, added] of text.matchAll(ADDS_MANA)) {
    if (!added) continue;
    if (ANY_COLOR.test(added)) {
      for (const color of MANA_COLOR_ORDER) colors.add(color);
      continue;
    }
    // Los híbridos ({W/U}) y los pirexianos ({G/P}) producen cada color que incluyen.
    for (const [, symbol] of added.matchAll(/\{([^}]+)\}/g)) {
      for (const part of symbol?.split("/") ?? []) {
        if (isColor(part)) colors.add(part);
      }
    }
  }
  return MANA_COLOR_ORDER.filter((color) => colors.has(color));
}

function isColor(value: string): value is ManaColor {
  return (MANA_COLOR_ORDER as readonly string[]).includes(value);
}

export interface ManaBalance {
  /** Copias que pueden producir ese color. */
  sources: Record<ManaColor, number>;
  /** Cartas distintas que producen maná de algún color. */
  totalSources: number;
}

/**
 * Cuántas fuentes de cada color hay en lo que se juega. Una carta que produce dos colores
 * cuenta para los dos: es una fuente de cada uno, que es como se cuenta al construir.
 */
export function countManaSources(lines: DeckCardLine[]): ManaBalance {
  const sources: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  let totalSources = 0;

  for (const { card, quantity } of lines) {
    const colors = producedColors(card);
    if (colors.length === 0) continue;
    totalSources += quantity;
    for (const color of colors) sources[color] += quantity;
  }
  return { sources, totalSources };
}

/** Reparto de un color: qué parte de los símbolos pide y qué parte de las fuentes tiene. */
export interface ColorBalance {
  color: ManaColor;
  pips: number;
  sources: number;
  /** De 0 a 1: su parte de todos los símbolos de color del mazo. */
  pipShare: number;
  /** De 0 a 1: su parte de todas las fuentes de color del mazo. */
  sourceShare: number;
  /** Pide bastante más de lo que produce el mazo. */
  isShort: boolean;
}

/**
 * Un color se marca como corto cuando su parte de las fuentes se queda 10 puntos por debajo
 * de su parte de los símbolos. Por debajo de eso, la diferencia entra dentro de lo normal
 * (hay tierras que dan varios colores, y no todas las cartas se juegan en el turno 1).
 */
const SHORT_BY = 0.1;

/** Con dos o tres símbolos sueltos, cualquier reparto se dispara: no se avisa por eso. */
const MIN_PIPS_TO_WARN = 4;

/**
 * Compara lo que el mazo pide (símbolos de color en los costes) con lo que produce (fuentes
 * de cada color). Solo salen los colores que aparecen de alguna de las dos formas.
 *
 * Es una guía de construcción, no una regla: dice dónde mirar, no cuántas tierras poner.
 */
export function balanceColors(
  pips: Record<ManaColor, number>,
  sources: Record<ManaColor, number>,
): ColorBalance[] {
  const total = (counts: Record<ManaColor, number>) =>
    MANA_COLOR_ORDER.reduce((sum, color) => sum + counts[color], 0);
  const totalPips = total(pips);
  const totalSources = total(sources);

  return MANA_COLOR_ORDER.filter((color) => pips[color] > 0 || sources[color] > 0).map((color) => {
    const pipShare = totalPips === 0 ? 0 : pips[color] / totalPips;
    const sourceShare = totalSources === 0 ? 0 : sources[color] / totalSources;
    return {
      color,
      pips: pips[color],
      sources: sources[color],
      pipShare,
      sourceShare,
      isShort: pips[color] >= MIN_PIPS_TO_WARN && pipShare - sourceShare >= SHORT_BY,
    };
  });
}
