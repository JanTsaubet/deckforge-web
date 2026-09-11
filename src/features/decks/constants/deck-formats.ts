import type { DeckFormat } from "../types/deck";

/** Nombres visibles de cada formato. Compartido por tarjetas, filtros y selectores. */
export const DECK_FORMAT_LABELS: Record<DeckFormat, string> = {
  commander: "Commander",
  standard: "Standard",
  pioneer: "Pioneer",
  modern: "Modern",
  legacy: "Legacy",
  vintage: "Vintage",
  pauper: "Pauper",
  brawl: "Brawl",
};
