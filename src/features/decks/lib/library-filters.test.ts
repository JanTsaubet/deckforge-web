import { describe, expect, it } from "vitest";
import type { DeckSummary } from "../types/deck";
import {
  applyLibraryFilters,
  DEFAULT_LIBRARY_FILTERS,
  parseLibraryFilters,
  toLibrarySearchParams,
} from "./library-filters";

function deck(overrides: Partial<DeckSummary>): DeckSummary {
  return {
    id: overrides.name ?? "id",
    ownerUsername: "planeswalker",
    name: "Mazo",
    format: "commander",
    visibility: "private",
    colorIdentity: [],
    cardCount: 0,
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

const decks = [
  deck({ name: "Átraxa, superamigos", updatedAt: "2026-09-10T00:00:00.000Z" }),
  deck({ name: "burn", format: "modern", updatedAt: "2026-09-12T00:00:00.000Z" }),
  deck({ name: "Zombis de Gisa", updatedAt: "2026-09-11T00:00:00.000Z" }),
];

const names = (list: DeckSummary[]) => list.map((item) => item.name);

describe("applyLibraryFilters", () => {
  it("por defecto enseña todo, lo más reciente primero", () => {
    expect(names(applyLibraryFilters([...decks], DEFAULT_LIBRARY_FILTERS))).toEqual([
      "burn",
      "Zombis de Gisa",
      "Átraxa, superamigos",
    ]);
  });

  it("busca por nombre sin distinguir mayúsculas ni tildes", () => {
    const result = applyLibraryFilters([...decks], { ...DEFAULT_LIBRARY_FILTERS, query: "atraxa" });

    expect(names(result)).toEqual(["Átraxa, superamigos"]);
  });

  it("filtra por formato", () => {
    const result = applyLibraryFilters([...decks], {
      ...DEFAULT_LIBRARY_FILTERS,
      format: "modern",
    });

    expect(names(result)).toEqual(["burn"]);
  });

  it("ordena por nombre como en un diccionario, no por código de carácter", () => {
    const result = applyLibraryFilters([...decks], { ...DEFAULT_LIBRARY_FILTERS, sort: "name" });

    // Por código de carácter, "Á" iría después de "Z" y "burn" (minúscula) al final.
    expect(names(result)).toEqual(["Átraxa, superamigos", "burn", "Zombis de Gisa"]);
  });
});

describe("parseLibraryFilters", () => {
  it("lee los valores válidos de la URL", () => {
    expect(
      parseLibraryFilters({ q: " goblins ", format: "pauper", sort: "name", view: "list" }),
    ).toEqual({ query: "goblins", format: "pauper", sort: "name", view: "list" });
  });

  it("ignora los valores inventados", () => {
    expect(parseLibraryFilters({ format: "inventado", sort: "raro", view: "3d" })).toEqual(
      DEFAULT_LIBRARY_FILTERS,
    );
  });
});

describe("toLibrarySearchParams", () => {
  it("no escribe los valores por defecto, para que la URL quede limpia", () => {
    expect(toLibrarySearchParams(DEFAULT_LIBRARY_FILTERS).toString()).toBe("");
    expect(
      toLibrarySearchParams({
        ...DEFAULT_LIBRARY_FILTERS,
        format: "modern",
        view: "list",
      }).toString(),
    ).toBe("format=modern&view=list");
  });
});
