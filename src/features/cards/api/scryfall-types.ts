/**
 * Subconjunto tipado de los objetos de la API de Scryfall que consume la app.
 * Referencia: https://scryfall.com/docs/api
 */

export interface ScryfallList<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  next_page?: string;
  total_cards?: number;
}

export interface ScryfallCatalog {
  object: "catalog";
  total_values: number;
  data: string[];
}

export interface ScryfallImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ScryfallCardFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  image_uris?: ScryfallImageUris;
}

export interface ScryfallCard {
  object: "card";
  id: string;
  oracle_id?: string;
  name: string;
  layout?: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity: string[];
  rarity: string;
  set: string;
  set_name: string;
  collector_number: string;
  released_at: string;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
  prices: Record<"usd" | "usd_foil" | "eur" | "tix", string | null>;
  legalities: Record<string, string>;
}

export interface ScryfallRuling {
  object: "ruling";
  oracle_id: string;
  source: "wotc" | "scryfall";
  published_at: string;
  comment: string;
}
