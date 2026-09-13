import { describe, expect, it } from "vitest";
import { columnsForWidth, GRID_GAP, rowHeightForWidth } from "./card-grid-layout";

describe("columnsForWidth", () => {
  it("crece por tramos según el ancho disponible", () => {
    expect(columnsForWidth(320)).toBe(2);
    expect(columnsForWidth(639)).toBe(2);
    expect(columnsForWidth(640)).toBe(3);
    expect(columnsForWidth(1024)).toBe(4);
    expect(columnsForWidth(1280)).toBe(5);
    expect(columnsForWidth(2560)).toBe(5);
  });

  it("nunca deja la rejilla sin columnas", () => {
    // Antes de la primera medición el ancho es 0: dividir entre 0 columnas daría Infinity.
    expect(columnsForWidth(0)).toBeGreaterThan(0);
  });
});

describe("rowHeightForWidth", () => {
  it("usa la proporción de una carta más la separación", () => {
    // 4 columnas en 1000 px: (1000 - 3*16) / 4 = 238 de ancho por carta.
    const cardWidth = (1000 - GRID_GAP * 3) / 4;

    expect(rowHeightForWidth(1000, 4)).toBeCloseTo(cardWidth * (7 / 5) + GRID_GAP, 5);
  });

  it("una carta más ancha implica una fila más alta", () => {
    expect(rowHeightForWidth(1200, 3)).toBeGreaterThan(rowHeightForWidth(600, 3));
  });
});
