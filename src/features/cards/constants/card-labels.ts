import type { Legality, Rarity } from "../types/card";

/** Formatos que se muestran en la tabla de legalidad, con Commander primero. */
export const LEGALITY_FORMATS = [
  "commander",
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "pauper",
  "brawl",
] as const;

export const FORMAT_LABELS: Record<(typeof LEGALITY_FORMATS)[number], string> = {
  commander: "Commander",
  standard: "Standard",
  pioneer: "Pioneer",
  modern: "Modern",
  legacy: "Legacy",
  vintage: "Vintage",
  pauper: "Pauper",
  brawl: "Brawl",
};

export const LEGALITY_LABELS: Record<Legality, string> = {
  legal: "Legal",
  not_legal: "No legal",
  restricted: "Restringida",
  banned: "Prohibida",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Común",
  uncommon: "Infrecuente",
  rare: "Rara",
  mythic: "Mítica",
  special: "Especial",
  bonus: "Extra",
};
