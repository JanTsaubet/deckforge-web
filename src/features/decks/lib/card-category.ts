/** Categorías de la lista del mazo, en el orden en que se muestran. */
export const CARD_CATEGORIES = [
  "creature",
  "planeswalker",
  "battle",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "land",
  "other",
] as const;

export type CardCategory = (typeof CARD_CATEGORIES)[number];

export const CARD_CATEGORY_LABELS: Record<CardCategory, string> = {
  creature: "Criaturas",
  planeswalker: "Planeswalkers",
  battle: "Batallas",
  instant: "Instantáneos",
  sorcery: "Conjuros",
  artifact: "Artefactos",
  enchantment: "Encantamientos",
  land: "Tierras",
  other: "Otras",
};

/**
 * En qué grupo va una carta según su línea de tipo. Una carta con varios tipos va al primero
 * de esta lista que tenga: una criatura artefacto es criatura; una tierra criatura (Dryad
 * Arbor) es criatura. Las de dos caras se clasifican por la cara frontal.
 */
export function cardCategory(typeLine: string): CardCategory {
  const front = typeLine.split(" // ")[0] ?? typeLine;
  const types = front.split("—")[0] ?? front;

  for (const [category, keyword] of [
    ["creature", "Creature"],
    ["planeswalker", "Planeswalker"],
    ["battle", "Battle"],
    ["land", "Land"],
    ["instant", "Instant"],
    ["sorcery", "Sorcery"],
    ["artifact", "Artifact"],
    ["enchantment", "Enchantment"],
  ] as const) {
    if (new RegExp(`\\b${keyword}\\b`).test(types)) return category;
  }
  return "other";
}

/** ¿Es una tierra básica? Se pueden llevar tantas copias como se quiera, en cualquier formato. */
export function isBasicLand(typeLine: string): boolean {
  return /\bBasic\b/.test(typeLine) && /\bLand\b/.test(typeLine);
}
