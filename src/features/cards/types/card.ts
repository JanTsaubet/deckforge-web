export type ManaColor = "W" | "U" | "B" | "R" | "G";
export type Rarity = "common" | "uncommon" | "rare" | "mythic" | "special" | "bonus";
export type Legality = "legal" | "not_legal" | "restricted" | "banned";

export interface CardImages {
  small: string;
  normal: string;
  large: string;
  artCrop: string;
}

/**
 * Carta en el modelo de dominio de DeckForge.
 * Desacoplada a propósito del formato de Scryfall: si cambiamos de proveedor
 * (o servimos las cartas desde nuestra API) la UI no se ve afectada.
 */
export interface Card {
  /** Id de una impresión concreta (id de Scryfall). */
  id: string;
  /** Id de la carta "abstracta", común a todas sus impresiones. */
  oracleId: string;
  name: string;
  manaCost?: string;
  manaValue: number;
  typeLine: string;
  oracleText?: string;
  colors: ManaColor[];
  colorIdentity: ManaColor[];
  rarity: Rarity;
  set: { code: string; name: string };
  collectorNumber: string;
  // TODO(Fase 1): modelar cartas de varias caras (card_faces) de forma completa.
  images?: CardImages;
  prices: { usd?: string; eur?: string };
  legalities: Record<string, Legality>;
}

export type CardSortOrder = "name" | "cmc" | "released" | "rarity" | "usd" | "edhrec";

export interface CardSearchParams {
  /** Consulta con sintaxis de Scryfall, p. ej. `t:creature c:g mv<=3`. */
  query: string;
  page?: number;
  order?: CardSortOrder;
}
