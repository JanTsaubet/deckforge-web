import { describe, expect, it } from "vitest";
import { parseSearchTab } from "./search-tab";

describe("parseSearchTab", () => {
  it("acepta las pestañas conocidas", () => {
    expect(parseSearchTab("cards")).toBe("cards");
    expect(parseSearchTab("decks")).toBe("decks");
  });

  it("cae en 'cards' cuando el parámetro falta o es basura", () => {
    // La URL la escribe cualquiera: un valor inventado no debe romper la pantalla.
    expect(parseSearchTab(undefined)).toBe("cards");
    expect(parseSearchTab("")).toBe("cards");
    expect(parseSearchTab("<script>")).toBe("cards");
  });
});
