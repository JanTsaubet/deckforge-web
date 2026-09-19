import { describe, expect, it } from "vitest";
import { describeOAuthError } from "./social-providers";

describe("describeOAuthError", () => {
  it("sin error no hay mensaje", () => {
    expect(describeOAuthError(undefined)).toBeUndefined();
  });

  it("explica por qué no se une una cuenta existente con el mismo email", () => {
    expect(describeOAuthError("account_not_linked")).toMatch(/Entra con tu contraseña/);
  });

  it("reconoce la cancelación en la pantalla del proveedor", () => {
    expect(describeOAuthError("access_denied")).toMatch(/cancelado/);
  });

  it("con un código desconocido da un mensaje genérico, nunca el código crudo", () => {
    const message = describeOAuthError("algo_raro");

    expect(message).toMatch(/No se ha podido entrar/);
    expect(message).not.toContain("algo_raro");
  });
});
