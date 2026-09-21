import { describe, expect, it } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import type { DeckCardLine } from "../types/deck";
import {
  countCopies,
  GROUP_MODES,
  groupByBoard,
  groupLines,
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
  tags: [],
});

const names = (lines: DeckCardLine[]) => lines.map((entry) => entry.card.name);

describe("toDeckCardLines", () => {
  it("deja fuera las cartas que el catálogo aún no conoce, y conserva las etiquetas", () => {
    const lines = toDeckCardLines([
      { cardId: "bolt", board: "main", quantity: 4, tags: ["remoción"], card: bolt },
      { cardId: "desconocida", board: "main", quantity: 1, tags: [] },
    ]);

    expect(lines).toEqual([{ card: bolt, board: "main", quantity: 4, tags: ["remoción"] }]);
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

/** Las etiquetas de cada grupo, en orden: lo que ve quien mira el mazo. */
const labels = (groups: ReturnType<typeof groupLines>) =>
  groups.map((group) => `${group.label}: ${names(group.lines).join(", ")}`);

describe("groupLines", () => {
  const goblins = catalogCard({
    id: "goblins",
    name: "Goblin Bombardment",
    typeLine: "Enchantment",
    manaValue: 2,
    colors: ["R"],
  });
  const boros = catalogCard({
    id: "boros",
    name: "Lightning Helix",
    typeLine: "Instant",
    manaValue: 2,
    colors: ["R", "W"],
  });
  const emrakul = catalogCard({
    id: "emrakul",
    name: "Emrakul, the Aeons Torn",
    typeLine: "Legendary Creature — Eldrazi",
    manaValue: 15,
  });

  it("por tipo, en el orden de siempre y con las tierras al final", () => {
    const groups = groupLines([line(mountain, 20), line(bolt), line(sol), line(krenko)], "type");

    expect(labels(groups)).toEqual([
      "Criaturas: Krenko, Mob Boss",
      "Instantáneos: Lightning Bolt",
      "Artefactos: Sol Ring",
      "Tierras: Mountain",
    ]);
  });

  it("por coste, de menos a más, con 7+ juntos y las tierras aparte", () => {
    const groups = groupLines(
      [line(mountain), line({ ...sol, manaValue: 1 }), line(goblins), line(emrakul)],
      "cost",
    );

    expect(labels(groups)).toEqual([
      "Coste 1: Sol Ring",
      "Coste 2: Goblin Bombardment",
      "Coste 7+: Emrakul, the Aeons Torn",
      "Tierras: Mountain",
    ]);
  });

  it("por color: uno solo, multicolor, incolora y tierras, en orden WUBRG", () => {
    const groups = groupLines([line(mountain), line(sol), line(boros), line(goblins)], "color");

    expect(labels(groups)).toEqual([
      "Rojo: Goblin Bombardment",
      "Multicolor: Lightning Helix",
      "Incoloras: Sol Ring",
      "Tierras: Mountain",
    ]);
  });

  it("por etiqueta: una carta con varias sale en cada una, y las demás al final", () => {
    const groups = groupLines(
      [
        { ...line(sol), tags: ["rampa", "artefacto"] },
        { ...line(bolt), tags: ["remoción"] },
        { ...line(krenko), tags: ["Rampa"] },
        line(mountain),
      ],
      "tag",
    );

    expect(labels(groups)).toEqual([
      "artefacto: Sol Ring",
      "rampa: Sol Ring",
      "Rampa: Krenko, Mob Boss",
      "remoción: Lightning Bolt",
      "Sin etiqueta: Mountain",
    ]);
  });

  it("las claves no se repiten, aunque una etiqueta se llame como un tipo", () => {
    const groups = groupLines([{ ...line(sol), tags: ["land"] }, line(mountain)], "tag");

    expect(groups.map((group) => group.key)).toEqual(["tag:land", "untagged"]);
  });

  it("sin cartas, sin grupos", () => {
    for (const mode of GROUP_MODES) expect(groupLines([], mode)).toEqual([]);
  });
});
