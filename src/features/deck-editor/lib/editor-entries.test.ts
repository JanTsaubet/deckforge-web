import { describe, expect, it } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import {
  addCopies,
  diffEntries,
  moveCard,
  setQuantity,
  toEditorEntries,
  type EditorEntry,
} from "./editor-entries";

const bolt = catalogCard({ id: "bolt", name: "Lightning Bolt" });
const krenko = catalogCard({ id: "krenko", name: "Krenko, Mob Boss" });

const summary = (entries: EditorEntry[]) =>
  entries.map((entry) => `${entry.board}:${entry.card.id}×${entry.quantity}`);

describe("setQuantity / addCopies", () => {
  it("añade, suma, resta y quita al llegar a 0", () => {
    let entries: EditorEntry[] = [];
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
    const original: EditorEntry[] = [{ card: bolt, board: "main", quantity: 1 }];

    addCopies(original, bolt, "main", 1);

    expect(original[0]?.quantity).toBe(1);
  });
});

describe("moveCard", () => {
  it("mueve todas las copias a otra zona, sumándolas a las que ya hubiera", () => {
    const entries: EditorEntry[] = [
      { card: bolt, board: "main", quantity: 3 },
      { card: bolt, board: "sideboard", quantity: 1 },
    ];

    expect(summary(moveCard(entries, bolt, "main", "sideboard"))).toEqual(["sideboard:bolt×4"]);
  });

  it("al hueco de comandante solo va una copia", () => {
    const entries: EditorEntry[] = [{ card: krenko, board: "main", quantity: 2 }];

    expect(summary(moveCard(entries, krenko, "main", "commander"))).toEqual([
      "main:krenko×1",
      "commander:krenko×1",
    ]);
  });
});

describe("diffEntries", () => {
  it("da la cantidad final de lo que cambia, y 0 de lo que desaparece", () => {
    const before: EditorEntry[] = [
      { card: bolt, board: "main", quantity: 4 },
      { card: krenko, board: "main", quantity: 1 },
    ];
    const after = moveCard(addCopies(before, bolt, "main", -1), krenko, "main", "commander");

    expect(diffEntries(before, after)).toEqual([
      { cardId: "bolt", board: "main", quantity: 3 },
      { cardId: "krenko", board: "commander", quantity: 1 },
      { cardId: "krenko", board: "main", quantity: 0 },
    ]);
  });

  it("sin cambios, no hay nada que enviar", () => {
    const entries: EditorEntry[] = [{ card: bolt, board: "main", quantity: 4 }];

    expect(diffEntries(entries, [...entries])).toEqual([]);
  });
});

describe("toEditorEntries", () => {
  it("deja fuera las cartas que el catálogo aún no conoce", () => {
    const entries = toEditorEntries([
      { cardId: "bolt", board: "main", quantity: 4, tags: [], card: bolt },
      { cardId: "desconocida", board: "main", quantity: 1, tags: [] },
    ]);

    expect(summary(entries)).toEqual(["main:bolt×4"]);
  });
});
