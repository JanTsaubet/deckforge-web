import { describe, expect, it } from "vitest";
import type { DeckSummary } from "../types/deck";
import {
  applyLibraryFilters,
  collectTags,
  DEFAULT_LIBRARY_FILTERS,
  libraryHref,
  parseLibraryFilters,
  toLibrarySearchParams,
  UNFILED_FOLDER,
} from "./library-filters";

const FOLDER = "0f8d6a52-3c1e-4b7a-9d2f-5e6a7b8c9d0e";

function deck(overrides: Partial<DeckSummary>): DeckSummary {
  return {
    id: overrides.name ?? "id",
    ownerUsername: "planeswalker",
    name: "Mazo",
    format: "commander",
    visibility: "private",
    tags: [],
    colorIdentity: [],
    cardCount: 0,
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

const decks = [
  deck({ name: "Átraxa, superamigos", updatedAt: "2026-09-10T00:00:00.000Z", tags: ["cedh"] }),
  deck({ name: "burn", format: "modern", updatedAt: "2026-09-12T00:00:00.000Z", folderId: FOLDER }),
  deck({
    name: "Zombis de Gisa",
    updatedAt: "2026-09-11T00:00:00.000Z",
    folderId: FOLDER,
    tags: ["casual", "cedh"],
  }),
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

  it("filtra por carpeta, y por «sin carpeta»", () => {
    const inFolder = applyLibraryFilters([...decks], {
      ...DEFAULT_LIBRARY_FILTERS,
      folder: FOLDER,
    });
    const unfiled = applyLibraryFilters([...decks], {
      ...DEFAULT_LIBRARY_FILTERS,
      folder: UNFILED_FOLDER,
    });

    expect(names(inFolder)).toEqual(["burn", "Zombis de Gisa"]);
    expect(names(unfiled)).toEqual(["Átraxa, superamigos"]);
  });

  it("filtra por etiqueta, combinable con la carpeta", () => {
    const result = applyLibraryFilters([...decks], {
      ...DEFAULT_LIBRARY_FILTERS,
      folder: FOLDER,
      tag: "cedh",
    });

    expect(names(result)).toEqual(["Zombis de Gisa"]);
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
      parseLibraryFilters({
        folder: FOLDER,
        tag: " cEDH ",
        q: " goblins ",
        format: "pauper",
        sort: "name",
        view: "list",
      }),
    ).toEqual({
      folder: FOLDER,
      tag: "cedh",
      query: "goblins",
      format: "pauper",
      sort: "name",
      view: "list",
    });
  });

  it("ignora los valores inventados", () => {
    expect(
      parseLibraryFilters({ folder: "../x", format: "inventado", sort: "raro", view: "3d" }),
    ).toEqual(DEFAULT_LIBRARY_FILTERS);
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

describe("libraryHref", () => {
  it("construye el enlace de la biblioteca con los filtros", () => {
    expect(libraryHref(DEFAULT_LIBRARY_FILTERS)).toBe("/decks");
    expect(libraryHref({ ...DEFAULT_LIBRARY_FILTERS, folder: UNFILED_FOLDER, tag: "cedh" })).toBe(
      "/decks?folder=none&tag=cedh",
    );
  });
});

describe("collectTags", () => {
  it("reúne las etiquetas de la biblioteca sin repetir y en orden", () => {
    expect(collectTags(decks)).toEqual(["casual", "cedh"]);
  });
});
