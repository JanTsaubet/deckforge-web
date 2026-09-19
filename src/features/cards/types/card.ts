export type ManaColor = "W" | "U" | "B" | "R" | "G";
export type Rarity = "common" | "uncommon" | "rare" | "mythic" | "special" | "bonus";
export type Legality = "legal" | "not_legal" | "restricted" | "banned";

export interface CardImages {
  small: string;
  normal: string;
  large: string;
  artCrop: string;
}

/** Una cara de una carta con varias: transformables, modales de doble cara, partidas… */
export interface CardFace {
  name: string;
  manaCost?: string;
  typeLine?: string;
  oracleText?: string;
  /** Solo las cartas con dos caras físicas traen una imagen por cara. */
  images?: CardImages;
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
  /** En cartas de varias caras, el coste de la cara frontal. */
  manaCost?: string;
  manaValue: number;
  typeLine: string;
  /** Texto de reglas. En las cartas de varias caras vive en cada `faces[i]`. */
  oracleText?: string;
  colors: ManaColor[];
  colorIdentity: ManaColor[];
  rarity: Rarity;
  set: { code: string; name: string };
  collectorNumber: string;
  /** Imagen de la cara frontal, o de la única que tenga. */
  images?: CardImages;
  /** Caras de la carta; vacío en las cartas de una sola cara. */
  faces: CardFace[];
  prices: { usd?: string; eur?: string };
  legalities: Record<string, Legality>;
  /** Fecha de salida de esta impresión (AAAA-MM-DD). */
  releasedAt?: string;
}

export type CardSortOrder = "name" | "cmc" | "released" | "rarity" | "usd" | "edhrec";

export interface CardSearchParams {
  /** Consulta con sintaxis de Scryfall, p. ej. `t:creature c:g mv<=3`. */
  query: string;
  page?: number;
  order?: CardSortOrder;
}

/** Aclaración sobre cómo funciona la carta, de Wizards o de Scryfall. */
export interface CardRuling {
  source: "wotc" | "scryfall";
  /** Fecha de publicación (AAAA-MM-DD). */
  publishedAt: string;
  comment: string;
}

/**
 * Cómo identificar una carta al buscar varias a la vez: por impresión exacta (edición y
 * número de coleccionista) o por nombre, opcionalmente limitado a una edición.
 */
export type CardIdentifier =
  { setCode: string; collectorNumber: string } | { name: string; setCode?: string };
