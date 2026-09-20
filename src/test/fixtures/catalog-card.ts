import type { CatalogCard } from "@/features/decks/types/deck";

/** Carta de catálogo para tests: se cambia solo lo que importa en cada uno. */
export function catalogCard(overrides: Partial<CatalogCard> = {}): CatalogCard {
  return {
    id: "carta",
    name: "Carta",
    layout: "normal",
    manaValue: 2,
    typeLine: "Creature — Goblin",
    colors: [],
    colorIdentity: [],
    rarity: "common",
    setCode: "tst",
    setName: "Test",
    legalities: { commander: "legal" },
    gameChanger: false,
    ...overrides,
  };
}
