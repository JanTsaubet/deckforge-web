import { describe, expect, it, vi } from "vitest";
import type { Card, CardIdentifier } from "@/features/cards/types/card";
import { parseDecklist } from "./decklist-parser";
import { resolveDecklist } from "./resolve-decklist";

function card(name: string, set = "c21", collectorNumber = "1"): Card {
  return {
    id: `id-${name}`,
    oracleId: `oracle-${name}`,
    name,
    manaValue: 0,
    typeLine: "Artifact",
    colors: [],
    colorIdentity: [],
    rarity: "common",
    set: { code: set, name: set },
    collectorNumber,
    faces: [],
    prices: {},
    legalities: {},
  };
}

/**
 * Catálogo falso: encuentra por nombre (o por la primera mitad del nombre) y por impresión
 * exacta las cartas de `catalog`, como hace Scryfall.
 */
function fakeCatalog(catalog: Card[]) {
  const find = (identifier: CardIdentifier) =>
    catalog.find((candidate) =>
      "collectorNumber" in identifier
        ? candidate.set.code === identifier.setCode &&
          candidate.collectorNumber === identifier.collectorNumber
        : candidate.name.split(" // ")[0] === identifier.name &&
          (!identifier.setCode || candidate.set.code === identifier.setCode),
    );
  return { getCollection: vi.fn(async (ids: CardIdentifier[]) => ids.map(find)) };
}

describe("resolveDecklist", () => {
  it("resuelve las cartas y separa las que no existen", async () => {
    const cards = fakeCatalog([card("Sol Ring")]);
    const { lines } = parseDecklist("1 Sol Ring\n1 Sol Rnig");

    const result = await resolveDecklist(lines, cards);

    expect(result.entries).toEqual([
      {
        card: { id: "id-Sol Ring", name: "Sol Ring", typeLine: "Artifact" },
        board: "main",
        quantity: 1,
      },
    ]);
    expect(result.notFound.map((line) => line.name)).toEqual(["Sol Rnig"]);
  });

  it("si la edición no existe en Scryfall (códigos de Arena), busca solo por nombre", async () => {
    const cards = fakeCatalog([card("Llanowar Elves", "dom", "168")]);
    const { lines } = parseDecklist("4 Llanowar Elves (DAR) 168");

    const result = await resolveDecklist(lines, cards);

    expect(result.entries[0]?.card.name).toBe("Llanowar Elves");
    expect(cards.getCollection).toHaveBeenCalledTimes(2);
    expect(cards.getCollection).toHaveBeenLastCalledWith([{ name: "Llanowar Elves" }]);
  });

  it("descarta una impresión que apunta a otra carta y la busca por nombre", async () => {
    const cards = fakeCatalog([card("Opt", "xln", "65"), card("Negate", "xln", "65b")]);
    // En esta edición, el número 65 es Opt, no Negate.
    const { lines } = parseDecklist("1 Negate (XLN) 65");

    const result = await resolveDecklist(lines, cards);

    expect(result.entries[0]?.card.name).toBe("Negate");
  });

  it("busca las cartas partidas por su primera mitad", async () => {
    const cards = fakeCatalog([card("Fire // Ice")]);
    const { lines } = parseDecklist("1 Fire // Ice");

    const result = await resolveDecklist(lines, cards);

    expect(cards.getCollection).toHaveBeenCalledWith([{ name: "Fire", setCode: undefined }]);
    expect(result.entries[0]?.card.name).toBe("Fire // Ice");
  });

  it("junta las líneas de la misma carta en la misma zona", async () => {
    const cards = fakeCatalog([card("Mountain")]);
    const { lines } = parseDecklist("Deck\n20 Mountain\n10 Mountain\nSideboard\n1 Mountain");

    const result = await resolveDecklist(lines, cards);

    expect(result.entries.map(({ board, quantity }) => [board, quantity])).toEqual([
      ["main", 30],
      ["sideboard", 1],
    ]);
  });

  it("no repite la búsqueda si todo se encontró a la primera", async () => {
    const cards = fakeCatalog([card("Sol Ring")]);

    await resolveDecklist(parseDecklist("1 Sol Ring").lines, cards);

    expect(cards.getCollection).toHaveBeenCalledTimes(1);
  });
});
