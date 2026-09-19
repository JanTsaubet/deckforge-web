import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("acepta rutas internas", () => {
    expect(safeRedirectPath("/decks")).toBe("/decks");
    expect(safeRedirectPath("/decks/abc/edit?tab=stats")).toBe("/decks/abc/edit?tab=stats");
  });

  it("rechaza las URLs de otros sitios (redirección abierta)", () => {
    expect(safeRedirectPath("https://sitio-malicioso.example")).toBe("/decks");
    expect(safeRedirectPath("//sitio-malicioso.example")).toBe("/decks");
    expect(safeRedirectPath("/\\sitio-malicioso.example")).toBe("/decks");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/decks");
  });

  it("sin destino, va al valor por defecto", () => {
    expect(safeRedirectPath(undefined)).toBe("/decks");
    expect(safeRedirectPath(null, "/")).toBe("/");
  });
});
