import { describe, expect, it } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import type { DeckCardLine } from "../types/deck";
import {
  countCopies,
  groupByBoard,
  groupByCategory,
  playableLines,
  toDeckCardLines,
} from "./deck-lines";

const bolt = catalogCard({ id: "bolt", name: "Lightning Bolt", typeLine: "Instant" });
const krenko = catalogCard({
  id: "krenko",
  name: "Krenko, Mob Boss",
  typeLine: "Legendary Creature — Goblin Warrior",
});
const mountain = catalogCard({
  id: "mountain",
  name: "Mountain",
  typeLine: "Basic Land — Mountain",
});
const sol = catalogCard({ id: "sol", name: "Sol Ring", typeLine: "Artifact" });

const line = (card: DeckCardLine["card"], quantity = 1, board: DeckCardLine["board"] = "main") => ({
  card,
  board,
  quantity,
});

const names = (lines: DeckCardLine[]) => lines.map((entry) => entry.card.name);

describe("toDeckCardLines", () => {
  it("deja fuera las cartas que el catálogo aún no conoce", () => {
    const lines = toDeckCardLines([
      { cardId: "bolt", board: "main", quantity: 4, tags: [], card: bolt },
      { cardId: "desconocida", board: "main", quantity: 1, tags: [] },
    ]);

    expect(lines).toEqual([{ card: bolt, board: "main", quantity: 4 }]);
  });
});

describe("countCopies", () => {
  it("cuenta copias, no líneas", () => {
    expect(countCopies([line(bolt, 4), line(mountain, 20)])).toBe(24);
    expect(countCopies([])).toBe(0);
  });
});

describe("playableLines", () => {
  it("se queda con el comandante y el mazo, no con el banquillo ni las quizás", () => {
    const lines = playableLines([
      line(krenko, 1, "commander"),
      line(bolt),
      line(sol, 1, "sideboard"),
      line(mountain, 1, "maybeboard"),
    ]);

    expect(names(lines)).toEqual(["Krenko, Mob Boss", "Lightning Bolt"]);
  });
});

describe("groupByBoard", () => {
  it("reparte por zonas y ordena cada una por nombre", () => {
    const boards = groupByBoard([
      line(mountain, 20),
      line(krenko, 1, "commander"),
      line(bolt),
      line(sol),
    ]);

    expect(names(boards.commander)).toEqual(["Krenko, Mob Boss"]);
    expect(names(boards.main)).toEqual(["Lightning Bolt", "Mountain", "Sol Ring"]);
  });

  it("siempre devuelve las cuatro zonas, aunque estén vacías", () => {
    expect(Object.keys(groupByBoard([]))).toEqual(["commander", "main", "sideboard", "maybeboard"]);
  });
});

describe("groupByCategory", () => {
  it("agrupa por tipo en el orden de la lista, con las tierras al final", () => {
    const groups = groupByCategory([line(mountain, 20), line(bolt), line(sol), line(krenko)]);

    expect(groups.map((group) => group.category)).toEqual([
      "creature",
      "instant",
      "artifact",
      "land",
    ]);
    expect(names(groups[1]?.lines ?? [])).toEqual(["Lightning Bolt"]);
  });

  it("no devuelve grupos vacíos", () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
