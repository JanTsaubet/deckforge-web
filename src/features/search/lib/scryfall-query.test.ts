import { describe, expect, it } from "vitest";
import {
  buildScryfallQuery,
  EMPTY_FILTERS,
  hasActiveFilters,
  parseScryfallQuery,
} from "./scryfall-query";

describe("parseScryfallQuery", () => {
  it("reconoce los filtros que tienen control propio", () => {
    const filters = parseScryfallQuery("c:gw t:creature r:rare mv<=3 f:commander");

    expect(filters.colors).toEqual(["W", "G"]);
    expect(filters.colorMode).toBe("includes");
    expect(filters.type).toBe("creature");
    expect(filters.rarity).toBe("rare");
    expect(filters.manaValueOperator).toBe("<=");
    expect(filters.manaValue).toBe(3);
    expect(filters.format).toBe("commander");
    expect(filters.rest).toBe("");
  });

  it("distingue los tres modos de color", () => {
    expect(parseScryfallQuery("c:u").colorMode).toBe("includes");
    expect(parseScryfallQuery("c=u").colorMode).toBe("exact");
    expect(parseScryfallQuery("c<=u").colorMode).toBe("atMost");
  });

  it("entiende la identidad de color del comandante", () => {
    expect(parseScryfallQuery("id<=wub").identity).toEqual(["W", "U", "B"]);
    expect(parseScryfallQuery("id:rg").identity).toEqual(["R", "G"]);
  });

  it("conserva tal cual lo que no sabe representar", () => {
    const filters = parseScryfallQuery('o:"draw a card" is:commander c:u');

    expect(filters.colors).toEqual(["U"]);
    // Sin esto, tocar un filtro borraría lo que el usuario escribió a mano.
    expect(filters.rest).toBe('o:"draw a card" is:commander');
  });

  it("no confunde un tipo con una lista de colores", () => {
    const filters = parseScryfallQuery("t:goblin");

    expect(filters.type).toBe("goblin");
    expect(filters.colors).toEqual([]);
  });

  it("ignora valores de color inventados", () => {
    const filters = parseScryfallQuery("c:xyz");

    expect(filters.colors).toEqual([]);
    expect(filters.rest).toBe("c:xyz");
  });
});

describe("buildScryfallQuery", () => {
  it("ordena los colores en WUBRG y usa el operador del modo", () => {
    const query = buildScryfallQuery({ ...EMPTY_FILTERS, colors: ["G", "W"], colorMode: "exact" });

    expect(query).toBe("c=wg");
  });

  it("entrecomilla los tipos con espacios", () => {
    expect(buildScryfallQuery({ ...EMPTY_FILTERS, type: "legendary creature" })).toBe(
      't:"legendary creature"',
    );
  });

  it("sin filtros devuelve una consulta vacía", () => {
    expect(buildScryfallQuery(EMPTY_FILTERS)).toBe("");
  });
});

describe("ida y vuelta", () => {
  it("reconstruye la consulta original sin perder nada", () => {
    const query = 'c<=wu id<=wub t:creature r:mythic mv>=4 f:modern o:"draw a card"';

    expect(buildScryfallQuery(parseScryfallQuery(query))).toBe(query);
  });
});

describe("hasActiveFilters", () => {
  it("el texto libre por sí solo no cuenta como filtro activo", () => {
    expect(hasActiveFilters(parseScryfallQuery('o:"draw a card"'))).toBe(false);
    expect(hasActiveFilters(parseScryfallQuery("c:u"))).toBe(true);
  });
});
