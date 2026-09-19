import { describe, expect, it } from "vitest";
import { countByBoard, parseDecklist } from "./decklist-parser";

/** Solo lo que importa en cada test: zona, cantidad y nombre. */
const summary = (text: string, format?: "commander" | "modern") =>
  parseDecklist(text, { format }).lines.map(({ board, quantity, name }) => [board, quantity, name]);

describe("parseDecklist", () => {
  it("lee el formato de MTG Arena con secciones, edición y número de coleccionista", () => {
    const result = parseDecklist(
      [
        "About",
        "Name Atraxa, superamigos",
        "",
        "Commander",
        "1 Atraxa, Praetors' Voice (2X2) 190",
        "",
        "Deck",
        "1 Sol Ring (C21) 263",
        "4 Lightning Bolt (M11) 149 *F*",
        "",
        "Sideboard",
        "2 Duress (M19) 94",
      ].join("\n"),
    );

    expect(result.deckName).toBe("Atraxa, superamigos");
    expect(result.invalidLines).toEqual([]);
    expect(result.lines).toEqual([
      {
        lineNumber: 5,
        quantity: 1,
        name: "Atraxa, Praetors' Voice",
        setCode: "2x2",
        collectorNumber: "190",
        board: "commander",
      },
      {
        lineNumber: 8,
        quantity: 1,
        name: "Sol Ring",
        setCode: "c21",
        collectorNumber: "263",
        board: "main",
      },
      {
        lineNumber: 9,
        quantity: 4,
        name: "Lightning Bolt",
        setCode: "m11",
        collectorNumber: "149",
        board: "main",
      },
      {
        lineNumber: 12,
        quantity: 2,
        name: "Duress",
        setCode: "m19",
        collectorNumber: "94",
        board: "sideboard",
      },
    ]);
  });

  it("en formato MTGO, lo que va tras la línea en blanco es el banquillo", () => {
    expect(summary("4 Lightning Bolt\n20 Mountain\n\n3 Smash to Smithereens", "modern")).toEqual([
      ["main", 4, "Lightning Bolt"],
      ["main", 20, "Mountain"],
      ["sideboard", 3, "Smash to Smithereens"],
    ]);
  });

  it("en Commander, un banquillo de una o dos cartas es el comandante (convención de MTGO)", () => {
    expect(summary("1 Sol Ring\n99 Island\n\n1 Talrand, Sky Summoner", "commander")).toEqual([
      ["main", 1, "Sol Ring"],
      ["main", 99, "Island"],
      ["commander", 1, "Talrand, Sky Summoner"],
    ]);
  });

  it("no toca un banquillo de verdad aunque el formato sea Commander", () => {
    const boards = summary("1 Sol Ring\n\n1 Duress\n1 Negate\n1 Pyroblast", "commander").map(
      ([board]) => board,
    );

    expect(boards).toEqual(["main", "sideboard", "sideboard", "sideboard"]);
  });

  it("acepta las variantes habituales de cantidad y la línea sin cantidad", () => {
    expect(summary("4x Counterspell\n2 x Brainstorm\nSol Ring")).toEqual([
      ["main", 4, "Counterspell"],
      ["main", 2, "Brainstorm"],
      ["main", 1, "Sol Ring"],
    ]);
  });

  it("entiende el prefijo SB: y las cabeceras con dos puntos o con recuento", () => {
    expect(summary("SIDEBOARD:\n1 Duress\nMaybeboard (1)\n1 Opt\nMain\nSB: 2 Negate")).toEqual([
      ["sideboard", 1, "Duress"],
      ["maybeboard", 1, "Opt"],
      ["sideboard", 2, "Negate"],
    ]);
  });

  it("reconoce las cabeceras en español", () => {
    expect(
      summary("Comandante\n1 Krenko, Mob Boss\nMazo\n1 Sol Ring\nBanquillo\n1 Duress"),
    ).toEqual([
      ["commander", 1, "Krenko, Mob Boss"],
      ["main", 1, "Sol Ring"],
      ["sideboard", 1, "Duress"],
    ]);
  });

  it("unifica el separador de las cartas partidas", () => {
    expect(summary("1 Fire /// Ice\n1 Commit//Memory")).toEqual([
      ["main", 1, "Fire // Ice"],
      ["main", 1, "Commit // Memory"],
    ]);
  });

  it("ignora comentarios y categorías, y señala las líneas que no son cartas", () => {
    const result = parseDecklist(
      "// Mi lista\n# notas\nCreatures (2)\n2 Llanowar Elves\n-----\n0 Opt",
    );

    expect(result.lines.map((line) => line.name)).toEqual(["Llanowar Elves"]);
    expect(result.invalidLines).toEqual([
      { lineNumber: 5, text: "-----" },
      { lineNumber: 6, text: "0 Opt" },
    ]);
  });

  it("acepta saltos de línea de Windows", () => {
    expect(summary("1 Sol Ring\r\n1 Arcane Signet")).toHaveLength(2);
  });
});

describe("countByBoard", () => {
  it("suma copias, no líneas", () => {
    const { lines } = parseDecklist("Commander\n1 Krenko, Mob Boss\nDeck\n1 Sol Ring\n30 Mountain");

    expect(countByBoard(lines)).toEqual({ commander: 1, main: 31, sideboard: 0, maybeboard: 0 });
  });
});
