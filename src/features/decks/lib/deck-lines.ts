import type { DeckBoard, DeckCardLine, DeckEntry } from "../types/deck";
import { CARD_CATEGORIES, cardCategory, type CardCategory } from "./card-category";

/**
 * Las cartas del mazo tal como llegan de la API, listas para enseñarlas. Las que el catálogo
 * aún no conoce se quedan fuera: no se pueden mostrar ni contar. No se pierden, siguen
 * guardadas en el mazo; el editor solo envía cambios de lo que se toca.
 */
export function toDeckCardLines(entries: DeckEntry[]): DeckCardLine[] {
  return entries.flatMap(({ card, board, quantity }) => (card ? [{ card, board, quantity }] : []));
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

export interface CategoryGroup {
  category: CardCategory;
  lines: DeckCardLine[];
}

/**
 * Agrupa por tipo de carta (criaturas, instantáneos…, tierras al final) conservando el orden
 * de `CARD_CATEGORIES`. Los grupos vacíos no aparecen; el orden dentro de cada uno es el que
 * traían las líneas.
 */
export function groupByCategory(lines: DeckCardLine[]): CategoryGroup[] {
  const groups = new Map<CardCategory, DeckCardLine[]>();
  for (const line of lines) {
    const category = cardCategory(line.card.typeLine);
    groups.set(category, [...(groups.get(category) ?? []), line]);
  }
  return CARD_CATEGORIES.flatMap((category) => {
    const group = groups.get(category);
    return group ? [{ category, lines: group }] : [];
  });
}
