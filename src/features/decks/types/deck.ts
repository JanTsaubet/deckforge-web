import type { ManaColor } from "@/features/cards/types/card";

export type DeckFormat =
  "commander" | "standard" | "pioneer" | "modern" | "legacy" | "vintage" | "pauper" | "brawl";

export type DeckVisibility = "public" | "unlisted" | "private";

/** Zonas en las que se reparte un mazo. */
export type DeckBoard = "commander" | "main" | "sideboard" | "maybeboard";

/**
 * Una carta del catálogo de DeckForge, con lo que necesitan el editor y la vista de un mazo.
 * Es más ligera que `Card` (la ficha completa de Scryfall de la pantalla de detalle).
 */
export interface CatalogCard {
  /** Id de Scryfall de la impresión. */
  id: string;
  oracleId?: string;
  name: string;
  layout: string;
  manaCost?: string;
  manaValue: number;
  typeLine: string;
  oracleText?: string;
  colors: ManaColor[];
  colorIdentity: ManaColor[];
  rarity: string;
  setCode: string;
  setName: string;
  imageSmall?: string;
  imageNormal?: string;
  imageArtCrop?: string;
  priceEur?: number;
  priceUsd?: number;
  /** Formato → "legal", "banned", "restricted" o "not_legal". */
  legalities: Record<string, string>;
  gameChanger: boolean;
}

export interface DeckEntry {
  cardId: string;
  quantity: number;
  board: DeckBoard;
  /** Etiquetas libres del usuario: "ramp", "removal", "wincon"… */
  tags: string[];
  /** Datos de la carta; ausente si el catálogo aún no la conoce. */
  card?: CatalogCard;
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
  colorIdentity: ManaColor[];
  coverImageUrl?: string;
  entries: DeckEntry[];
  /** Si quien lo ve es su dueño y puede editarlo. */
  viewerCanEdit: boolean;
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
