import type { DeckBoard, DeckFormat, DeckVisibility } from "../types/deck";

/** Formatos en el orden en que se ofrecen, con Commander primero. */
export const DECK_FORMATS = [
  "commander",
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "pauper",
  "brawl",
] as const satisfies readonly DeckFormat[];

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

/** Del más cerrado al más abierto: privado es el valor por defecto. */
export const DECK_VISIBILITIES = [
  "private",
  "unlisted",
  "public",
] as const satisfies readonly DeckVisibility[];

export const DECK_VISIBILITY_LABELS: Record<DeckVisibility, string> = {
  private: "Privado",
  unlisted: "Oculto (solo con enlace)",
  public: "Público",
};

/** Zonas en el orden en que se enseñan: el comandante siempre arriba. */
export const DECK_BOARDS = [
  "commander",
  "main",
  "sideboard",
  "maybeboard",
] as const satisfies readonly DeckBoard[];

export const DECK_BOARD_LABELS: Record<DeckBoard, string> = {
  commander: "Comandante",
  main: "Mazo",
  sideboard: "Banquillo",
  maybeboard: "Quizás",
};
