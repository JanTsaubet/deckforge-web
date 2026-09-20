import { describe, expect, it } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import type { DeckCardLine } from "../types/deck";
import { cardCategory, isBasicLand } from "./card-category";
import { computeDeckStats, countPips } from "./deck-stats";

const entry = (
  overrides: Parameters<typeof catalogCard>[0],
  quantity = 1,
  board: DeckCardLine["board"] = "main",
): DeckCardLine => ({
  card: catalogCard(overrides),
  board,
  quantity,
});

describe("cardCategory", () => {
  it.each([
    ["Legendary Creature — Goblin Warrior", "creature"],
    ["Artifact Creature — Golem", "creature"],
    ["Land Creature — Forest Dryad", "creature"],
    ["Basic Land — Mountain", "land"],
    ["Legendary Planeswalker — Ugin", "planeswalker"],
    ["Instant", "instant"],
    ["Tribal Sorcery — Goblin", "sorcery"],
    ["Legendary Artifact", "artifact"],
    ["Enchantment — Aura", "enchantment"],
    ["Instant // Sorcery", "instant"],
    ["Conspiracy", "other"],
  ])("%s → %s", (typeLine, category) => {
    expect(cardCategory(typeLine)).toBe(category);
  });

  it("reconoce las tierras básicas", () => {
    expect(isBasicLand("Basic Land — Mountain")).toBe(true);
    expect(isBasicLand("Basic Snow Land — Island")).toBe(true);
    expect(isBasicLand("Land")).toBe(false);
  });
});

describe("countPips", () => {
  it("cuenta los símbolos de color, también en híbridos y pirexianos", () => {
    expect(countPips("{2}{R}{R}", "R")).toBe(2);
    expect(countPips("{R/G}{G/P}", "G")).toBe(2);
    expect(countPips("{3}", "W")).toBe(0);
    expect(countPips(undefined, "U")).toBe(0);
  });
});

describe("computeDeckStats", () => {
  const entries: DeckCardLine[] = [
    entry(
      {
        id: "k",
        typeLine: "Legendary Creature — Goblin",
        manaValue: 4,
        manaCost: "{2}{R}{R}",
        priceEur: 2,
      },
      1,
      "commander",
    ),
    entry({ id: "b", typeLine: "Instant", manaValue: 1, manaCost: "{R}", priceEur: 0.5 }, 4),
    entry({ id: "m", typeLine: "Basic Land — Mountain", manaValue: 0, priceEur: 0.1 }, 30),
    entry(
      { id: "u", typeLine: "Legendary Creature — Eldrazi", manaValue: 10, manaCost: "{10}" },
      1,
    ),
    entry({ id: "s", typeLine: "Instant", manaValue: 1 }, 2, "sideboard"),
  ];

  it("cuenta por zona y lo que se juega (comandante + mazo)", () => {
    const stats = computeDeckStats(entries);

    expect(stats.byBoard).toEqual({ commander: 1, main: 35, sideboard: 2, maybeboard: 0 });
    expect(stats.playable).toBe(36);
  });

  it("la curva no cuenta tierras y junta 7 o más en la última barra", () => {
    const { curve, averageManaValue } = computeDeckStats(entries);

    expect(curve).toEqual([0, 4, 0, 0, 1, 0, 0, 1]);
    expect(averageManaValue).toBeCloseTo((4 + 4 * 1 + 10) / 6);
  });

  it("suma los símbolos de color de los costes, por copias", () => {
    expect(computeDeckStats(entries).colorPips).toEqual({ W: 0, U: 0, B: 0, R: 6, G: 0 });
  });

  it("suma el precio de lo que se juega y avisa de las cartas sin precio", () => {
    const stats = computeDeckStats(entries);

    expect(stats.priceEur).toBe(2 + 4 * 0.5 + 30 * 0.1);
    expect(stats.cardsWithoutPrice).toBe(1);
  });
});
