import type { ManaColor } from "@/features/cards/types/card";

export type DeckFormat =
  "commander" | "standard" | "pioneer" | "modern" | "legacy" | "vintage" | "pauper" | "brawl";

export type DeckVisibility = "public" | "unlisted" | "private";

/** Zonas en las que se reparte un mazo. */
export type DeckBoard = "commander" | "main" | "sideboard" | "maybeboard";

export interface DeckEntry {
  cardId: string;
  quantity: number;
  board: DeckBoard;
  /** Etiquetas libres del usuario: "ramp", "removal", "wincon"… */
  tags: string[];
}

export interface Deck {
  id: string;
  ownerUsername: string;
  name: string;
  description?: string;
  format: DeckFormat;
  visibility: DeckVisibility;
  /** Carpeta de la biblioteca del dueño; sin carpeta si no tiene. */
  folderId?: string;
  /** Etiquetas del mazo, en minúsculas: "cedh", "presupuesto"… */
  tags: string[];
  entries: DeckEntry[];
  /** Fechas en ISO 8601. */
  createdAt: string;
  updatedAt: string;
}

/** Proyección ligera de un mazo para listados (biblioteca, búsqueda, perfiles). */
export interface DeckSummary {
  id: string;
  ownerUsername: string;
  name: string;
  format: DeckFormat;
  visibility: DeckVisibility;
  folderId?: string;
  tags: string[];
  colorIdentity: ManaColor[];
  cardCount: number;
  coverImageUrl?: string;
  updatedAt: string;
}

/** Carpeta de la biblioteca. Planas: no hay subcarpetas. */
export interface DeckFolder {
  id: string;
  name: string;
  deckCount: number;
}

export interface DeckSearchParams {
  query?: string;
  format?: DeckFormat;
  page?: number;
}
