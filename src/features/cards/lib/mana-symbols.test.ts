import { describe, expect, it } from "vitest";
import { manaSymbolUrl, splitSymbols } from "./mana-symbols";

describe("manaSymbolUrl", () => {
  it("quita llaves y barras, como nombra Scryfall sus SVG", () => {
    expect(manaSymbolUrl("{T}")).toBe("https://svgs.scryfall.io/card-symbols/T.svg");
    expect(manaSymbolUrl("{W/U}")).toBe("https://svgs.scryfall.io/card-symbols/WU.svg");
    expect(manaSymbolUrl("{2/W}")).toBe("https://svgs.scryfall.io/card-symbols/2W.svg");
    expect(manaSymbolUrl("{G/P}")).toBe("https://svgs.scryfall.io/card-symbols/GP.svg");
    expect(manaSymbolUrl("{W/U/P}")).toBe("https://svgs.scryfall.io/card-symbols/WUP.svg");
  });
});

describe("splitSymbols", () => {
  it("separa texto y símbolos en orden", () => {
    expect(splitSymbols("{T}: Add {G}.")).toEqual([
      { kind: "symbol", value: "{T}" },
      { kind: "text", value: ": Add " },
      { kind: "symbol", value: "{G}" },
      { kind: "text", value: "." },
    ]);
  });

  it("un texto sin símbolos queda en un solo trozo", () => {
    expect(splitSymbols("Flying")).toEqual([{ kind: "text", value: "Flying" }]);
  });

  it("un texto vacío no produce trozos", () => {
    expect(splitSymbols("")).toEqual([]);
  });
});
