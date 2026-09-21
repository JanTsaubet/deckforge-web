import { describe, expect, it } from "vitest";
import type { DeckCardLine } from "@/features/decks/types/deck";
import { catalogCard } from "@/test/fixtures/catalog-card";
import {
  addCopies,
  diffEntries,
  moveCard,
  sameChange,
  setQuantity,
  setTags,
} from "./editor-entries";

const bolt = catalogCard({ id: "bolt", name: "Lightning Bolt" });
const krenko = catalogCard({ id: "krenko", name: "Krenko, Mob Boss" });

const summary = (entries: DeckCardLine[]) =>
  entries.map((entry) => `${entry.board}:${entry.card.id}×${entry.quantity}`);

describe("setQuantity / addCopies", () => {
  it("añade, suma, resta y quita al llegar a 0", () => {
    let entries: DeckCardLine[] = [];
    entries = addCopies(entries, bolt, "main", 4);
    entries = addCopies(entries, bolt, "main", -1);
    expect(summary(entries)).toEqual(["main:bolt×3"]);

    entries = addCopies(entries, bolt, "main", -3);
    expect(entries).toEqual([]);
  });

  it("no baja de 0 ni pasa del máximo", () => {
    expect(setQuantity([], bolt, "main", -5)).toEqual([]);
    expect(setQuantity([], bolt, "main", 5000)[0]?.quantity).toBe(999);
  });

  it("no modifica la lista original (el historial de deshacer depende de ello)", () => {
    const original: DeckCardLine[] = [{ card: bolt, board: "main", quantity: 1, tags: [] }];

    addCopies(original, bolt, "main", 1);

    expect(original[0]?.quantity).toBe(1);
  });
});

describe("moveCard", () => {
  it("mueve todas las copias a otra zona, sumándolas a las que ya hubiera", () => {
    const entries: DeckCardLine[] = [
      { card: bolt, board: "main", quantity: 3, tags: [] },
      { card: bolt, board: "sideboard", quantity: 1, tags: [] },
    ];

    expect(summary(moveCard(entries, bolt, "main", "sideboard"))).toEqual(["sideboard:bolt×4"]);
  });

  it("al hueco de comandante solo va una copia", () => {
    const entries: DeckCardLine[] = [{ card: krenko, board: "main", quantity: 2, tags: [] }];

    expect(summary(moveCard(entries, krenko, "main", "commander"))).toEqual([
      "main:krenko×1",
      "commander:krenko×1",
    ]);
  });
});

describe("diffEntries", () => {
  it("da la cantidad final de lo que cambia, y 0 de lo que desaparece", () => {
    const before: DeckCardLine[] = [
      { card: bolt, board: "main", quantity: 4, tags: [] },
      { card: krenko, board: "main", quantity: 1, tags: [] },
    ];
    const after = moveCard(addCopies(before, bolt, "main", -1), krenko, "main", "commander");

    expect(diffEntries(before, after)).toEqual([
      { cardId: "bolt", board: "main", quantity: 3, tags: [] },
      { cardId: "krenko", board: "commander", quantity: 1, tags: [] },
      { cardId: "krenko", board: "main", quantity: 0 },
    ]);
  });

  it("cambiar solo las etiquetas también es un cambio, y lleva la cantidad", () => {
    const before: DeckCardLine[] = [{ card: bolt, board: "main", quantity: 4, tags: [] }];
    const after = setTags(before, bolt, "main", ["remoción"]);

    expect(diffEntries(before, after)).toEqual([
      { cardId: "bolt", board: "main", quantity: 4, tags: ["remoción"] },
    ]);
  });

  it("un cambio de cantidad lleva también las etiquetas: el último cambio basta solo", () => {
    const before: DeckCardLine[] = [{ card: bolt, board: "main", quantity: 1, tags: ["remoción"] }];

    expect(diffEntries(before, addCopies(before, bolt, "main", 1))).toEqual([
      { cardId: "bolt", board: "main", quantity: 2, tags: ["remoción"] },
    ]);
  });

  it("sin cambios, no hay nada que enviar", () => {
    const entries: DeckCardLine[] = [{ card: bolt, board: "main", quantity: 4, tags: [] }];

    expect(diffEntries(entries, [...entries])).toEqual([]);
  });
});

describe("setTags", () => {
  const entries: DeckCardLine[] = [
    { card: bolt, board: "main", quantity: 4, tags: [] },
    { card: krenko, board: "commander", quantity: 1, tags: [] },
  ];

  it("cambia las etiquetas de esa carta en esa zona, y de nada más", () => {
    const tagged = setTags(entries, bolt, "main", ["remoción", "barata"]);

    expect(tagged[0]?.tags).toEqual(["remoción", "barata"]);
    expect(tagged[1]).toBe(entries[1]);
  });

  it("sin cambios devuelve la misma lista: nada que deshacer ni que guardar", () => {
    expect(setTags(entries, bolt, "main", [])).toBe(entries);
  });

  it("etiquetar una carta que no está no la añade", () => {
    expect(setTags(entries, bolt, "sideboard", ["remoción"])).toBe(entries);
  });
});

describe("moveCard con etiquetas", () => {
  it("las etiquetas viajan con la carta y se juntan con las que tuviera en el destino", () => {
    const entries: DeckCardLine[] = [
      { card: bolt, board: "main", quantity: 2, tags: ["remoción"] },
      { card: bolt, board: "sideboard", quantity: 1, tags: ["contra aggro", "remoción"] },
    ];

    const moved = moveCard(entries, bolt, "main", "sideboard");

    expect(moved).toEqual([
      { card: bolt, board: "sideboard", quantity: 3, tags: ["contra aggro", "remoción"] },
    ]);
  });

  it("a una zona donde no estaba, llega con las suyas", () => {
    const entries: DeckCardLine[] = [
      { card: bolt, board: "main", quantity: 2, tags: ["remoción"] },
    ];

    expect(moveCard(entries, bolt, "main", "maybeboard")).toEqual([
      { card: bolt, board: "maybeboard", quantity: 2, tags: ["remoción"] },
    ]);
  });
});

describe("sameChange", () => {
  it("compara cantidad y etiquetas", () => {
    const change = { cardId: "bolt", board: "main" as const, quantity: 2, tags: ["a"] };

    expect(sameChange(change, { ...change })).toBe(true);
    expect(sameChange(change, { ...change, quantity: 3 })).toBe(false);
    expect(sameChange(change, { ...change, tags: ["a", "b"] })).toBe(false);
  });
});
