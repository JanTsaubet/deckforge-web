import { describe, expect, it } from "vitest";
import { catalogCard } from "@/test/fixtures/catalog-card";
import type { DeckCardLine } from "../types/deck";
import { balanceColors, countManaSources, producedColors } from "./mana-sources";

const card = (overrides: Parameters<typeof catalogCard>[0]) => catalogCard(overrides);

const line = (overrides: Parameters<typeof catalogCard>[0], quantity = 1): DeckCardLine => ({
  card: catalogCard(overrides),
  board: "main",
  quantity,
  tags: [],
});

describe("producedColors", () => {
  it("las tierras básicas se reconocen por su tipo, sin texto", () => {
    expect(producedColors(card({ typeLine: "Basic Land — Mountain" }))).toEqual(["R"]);
    expect(producedColors(card({ typeLine: "Basic Land — Snow Swamp" }))).toEqual(["B"]);
    // Una tierra con dos tipos básicos (Tropical Island) es fuente de los dos colores.
    expect(producedColors(card({ typeLine: "Land — Forest Island" }))).toEqual(["U", "G"]);
  });

  it("lee del texto lo que añade cada carta", () => {
    const dual = card({
      typeLine: "Land",
      oracleText: "{T}: Add {W} or {U}.",
    });
    const rock = card({
      typeLine: "Artifact",
      oracleText: "{T}: Add {C}{C}. Spend this mana only to cast...",
    });
    const dork = card({
      typeLine: "Creature — Elf Druid",
      oracleText: "{T}: Add {G}.",
    });

    expect(producedColors(dual)).toEqual(["W", "U"]);
    expect(producedColors(dork)).toEqual(["G"]);
    // El maná incoloro no es un color: no cuenta como fuente de ninguno.
    expect(producedColors(rock)).toEqual([]);
  });

  it("«de cualquier color» cuenta como los cinco", () => {
    const tower = card({ typeLine: "Land", oracleText: "{T}: Add one mana of any color." });
    const chromatic = card({
      typeLine: "Artifact",
      oracleText: "{T}, Sacrifice this artifact: Add two mana of any one color.",
    });

    expect(producedColors(tower)).toEqual(["W", "U", "B", "R", "G"]);
    expect(producedColors(chromatic)).toEqual(["W", "U", "B", "R", "G"]);
  });

  it("los símbolos híbridos cuentan para sus dos colores", () => {
    const hybrid = card({ typeLine: "Land", oracleText: "{T}: Add {B/G}." });

    expect(producedColors(hybrid)).toEqual(["B", "G"]);
  });

  it("no confunde el coste de una carta con el maná que produce", () => {
    const spell = card({
      typeLine: "Instant",
      oracleText: "Counter target spell unless its controller pays {2}.",
    });
    const noText = card({ typeLine: "Creature — Goblin", oracleText: undefined });

    expect(producedColors(spell)).toEqual([]);
    expect(producedColors(noText)).toEqual([]);
  });

  it("lee las dos caras de una carta doble", () => {
    const modal = card({
      typeLine: "Sorcery // Land",
      oracleText: "Return from your graveyard...\n//\n{T}: Add {B}.",
    });

    expect(producedColors(modal)).toEqual(["B"]);
  });
});

describe("countManaSources", () => {
  it("cuenta copias, y una carta de dos colores es fuente de los dos", () => {
    const balance = countManaSources([
      line({ id: "mountain", typeLine: "Basic Land — Mountain" }, 10),
      line({ id: "dual", typeLine: "Land", oracleText: "{T}: Add {B} or {R}." }, 1),
      line({ id: "bolt", typeLine: "Instant", oracleText: "Deal 3 damage." }, 4),
    ]);

    expect(balance.sources).toEqual({ W: 0, U: 0, B: 1, R: 11, G: 0 });
    // Las 11 que producen algún color; el rayo no es una fuente.
    expect(balance.totalSources).toBe(11);
  });
});

describe("balanceColors", () => {
  const pips = { W: 0, U: 4, B: 0, R: 16, G: 0 };

  it("compara lo que pide cada color con lo que produce el mazo", () => {
    const balance = balanceColors(pips, { W: 0, U: 10, B: 0, R: 10, G: 0 });

    expect(balance.map((color) => color.color)).toEqual(["U", "R"]);
    expect(balance[1]).toMatchObject({ pips: 16, sources: 10, pipShare: 0.8, sourceShare: 0.5 });
  });

  it("avisa del color que se queda corto, no del que va sobrado", () => {
    const balance = balanceColors(pips, { W: 0, U: 10, B: 0, R: 10, G: 0 });

    expect(balance.find((color) => color.color === "R")?.isShort).toBe(true);
    expect(balance.find((color) => color.color === "U")?.isShort).toBe(false);
  });

  it("no avisa por unos pocos símbolos sueltos de un color", () => {
    const splash = balanceColors(
      { W: 2, U: 0, B: 0, R: 20, G: 0 },
      { W: 0, U: 0, B: 0, R: 20, G: 0 },
    );

    expect(splash.find((color) => color.color === "W")?.isShort).toBe(false);
  });

  it("un mazo sin símbolos de color no da ningún reparto", () => {
    expect(
      balanceColors({ W: 0, U: 0, B: 0, R: 0, G: 0 }, { W: 0, U: 0, B: 0, R: 0, G: 0 }),
    ).toEqual([]);
  });
});
