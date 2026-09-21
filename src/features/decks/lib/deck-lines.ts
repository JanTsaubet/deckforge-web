import { MANA_COLOR_LABELS } from "@/features/cards/constants/mana-colors";
import { MANA_COLOR_ORDER } from "@/features/cards/lib/colors";
import type { DeckBoard, DeckCardLine, DeckEntry } from "../types/deck";
import { CARD_CATEGORIES, CARD_CATEGORY_LABELS, cardCategory } from "./card-category";
import { CURVE_BUCKETS } from "./deck-stats";

/**
 * Las cartas del mazo tal como llegan de la API, listas para enseñarlas. Las que el catálogo
 * aún no conoce se quedan fuera: no se pueden mostrar ni contar. No se pierden, siguen
 * guardadas en el mazo; el editor solo envía cambios de lo que se toca.
 */
export function toDeckCardLines(entries: DeckEntry[]): DeckCardLine[] {
  return entries.flatMap(({ card, board, quantity, tags }) =>
    card ? [{ card, board, quantity, tags }] : [],
  );
}

/**
 * Las cartas que se juegan de verdad: el comandante y el mazo principal. El banquillo y las
 * "quizás" no cuentan ni para el tamaño ni para las estadísticas.
 */
export function playableLines(lines: DeckCardLine[]): DeckCardLine[] {
  return lines.filter((line) => line.board === "commander" || line.board === "main");
}

/** Copias totales (no líneas): dos líneas de dos copias son cuatro cartas. */
export function countCopies(lines: DeckCardLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

const byName = (a: DeckCardLine, b: DeckCardLine) => a.card.name.localeCompare(b.card.name);

/** El mazo repartido por zonas, cada una ordenada por nombre. Siempre están las cuatro. */
export function groupByBoard(lines: DeckCardLine[]): Record<DeckBoard, DeckCardLine[]> {
  const boards: Record<DeckBoard, DeckCardLine[]> = {
    commander: [],
    main: [],
    sideboard: [],
    maybeboard: [],
  };
  for (const line of lines) boards[line.board].push(line);
  for (const board of Object.values(boards)) board.sort(byName);
  return boards;
}

/** Formas de agrupar el mazo principal. */
export const GROUP_MODES = ["type", "cost", "color", "tag"] as const;
export type GroupMode = (typeof GROUP_MODES)[number];

export const GROUP_MODE_LABELS: Record<GroupMode, string> = {
  type: "Tipo",
  cost: "Coste",
  color: "Color",
  tag: "Etiqueta",
};

export interface LineGroup {
  /** Único dentro de una agrupación; sirve de clave para React y para arrastrar. */
  key: string;
  label: string;
  lines: DeckCardLine[];
}

/**
 * Reparte las líneas en grupos, en un orden fijo y sin grupos vacíos. Dentro de cada grupo
 * se conserva el orden en que llegan (por nombre, si vienen de `groupByBoard`).
 *
 * - **Tipo:** criaturas, planeswalkers… y las tierras al final.
 * - **Coste:** por valor de maná, de 0 a "7+", como la curva. Las tierras van aparte: una
 *   tierra "cuesta" 0, pero juntarla con los hechizos de coste 0 no le dice nada a nadie.
 * - **Color:** por los colores de la carta (no por su identidad): uno solo, multicolor o
 *   incolora. Las tierras, también aparte, por lo mismo.
 * - **Etiqueta:** un grupo por etiqueta, en orden alfabético. Una carta con varias sale en
 *   cada una (como las categorías de Archidekt) y las que no tienen van a "Sin etiqueta".
 */
export function groupLines(lines: DeckCardLine[], mode: GroupMode): LineGroup[] {
  switch (mode) {
    case "type":
      return collect(lines, CARD_CATEGORIES, (line) => [cardCategory(line.card.typeLine)]).map(
        ({ key, lines: group }) => ({ key, label: CARD_CATEGORY_LABELS[key], lines: group }),
      );
    case "cost":
      return collect(lines, COST_KEYS, (line) => [costKey(line)]).map(({ key, lines: group }) => ({
        key,
        label: COST_LABELS[key] ?? key,
        lines: group,
      }));
    case "color":
      return collect(lines, COLOR_KEYS, (line) => [colorKey(line)]).map(
        ({ key, lines: group }) => ({ key, label: COLOR_LABELS[key], lines: group }),
      );
    case "tag":
      return groupByTag(lines);
  }
}

/**
 * Mete cada línea en los grupos que diga `keysOf` y los devuelve en el orden de `order`,
 * saltándose los que se quedan vacíos.
 */
function collect<Key extends string>(
  lines: DeckCardLine[],
  order: readonly Key[],
  keysOf: (line: DeckCardLine) => Key[],
): Array<{ key: Key; lines: DeckCardLine[] }> {
  const groups = new Map<Key, DeckCardLine[]>();
  for (const line of lines) {
    for (const key of keysOf(line)) groups.set(key, [...(groups.get(key) ?? []), line]);
  }
  return order.flatMap((key) => {
    const group = groups.get(key);
    return group ? [{ key, lines: group }] : [];
  });
}

const isLand = (line: DeckCardLine) => cardCategory(line.card.typeLine) === "land";

/** "cost-0" … "cost-7" (la última es "7 o más") y, al final, las tierras. */
const COST_KEYS: string[] = [
  ...Array.from({ length: CURVE_BUCKETS }, (_, manaValue) => `cost-${manaValue}`),
  "land",
];

const COST_LABELS: Record<string, string> = Object.fromEntries(
  COST_KEYS.map((key, manaValue) => [
    key,
    key === "land"
      ? "Tierras"
      : `Coste ${manaValue === CURVE_BUCKETS - 1 ? `${manaValue}+` : manaValue}`,
  ]),
);

function costKey(line: DeckCardLine): string {
  if (isLand(line)) return "land";
  return `cost-${Math.min(Math.floor(line.card.manaValue), CURVE_BUCKETS - 1)}`;
}

const COLOR_KEYS = [...MANA_COLOR_ORDER, "multicolor", "colorless", "land"] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

const COLOR_LABELS: Record<ColorKey, string> = {
  ...MANA_COLOR_LABELS,
  multicolor: "Multicolor",
  colorless: "Incoloras",
  land: "Tierras",
};

function colorKey(line: DeckCardLine): ColorKey {
  if (isLand(line)) return "land";
  const [only, ...others] = line.card.colors;
  if (!only) return "colorless";
  return others.length > 0 ? "multicolor" : only;
}

/** Con quién se compara al ordenar etiquetas: "Remoción" va junto a "rampa", no al final. */
const tagCollator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

const UNTAGGED = "Sin etiqueta";

function groupByTag(lines: DeckCardLine[]): LineGroup[] {
  const tags = [...new Set(lines.flatMap((line) => line.tags))].sort(tagCollator.compare);
  const groups = collect(lines, [...tags, UNTAGGED], (line) =>
    line.tags.length > 0 ? line.tags : [UNTAGGED],
  );
  // La clave lleva prefijo: una etiqueta puede llamarse igual que cualquier otra cosa.
  return groups.map(({ key, lines: group }) => ({
    key: key === UNTAGGED ? "untagged" : `tag:${key}`,
    label: key,
    lines: group,
  }));
}
