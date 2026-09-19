import { describe, expect, it } from "vitest";
import { describeAuthError } from "./auth-errors";

describe("describeAuthError", () => {
  it("traduce los errores conocidos", () => {
    expect(describeAuthError({ code: "USERNAME_IS_ALREADY_TAKEN" })).toBe(
      "Ese nombre de usuario ya está en uso.",
    );
    expect(describeAuthError({ code: "INVALID_EMAIL_OR_PASSWORD" })).toContain("contraseña");
  });

  it("avisa de los límites de intentos", () => {
    expect(describeAuthError({ status: 429 })).toContain("Demasiados intentos");
  });

  it("ante un error desconocido da un mensaje útil en español, no el técnico", () => {
    expect(describeAuthError({ code: "ALGO_RARO", message: "Internal stack trace" })).toBe(
      "No se ha podido completar la operación. Inténtalo de nuevo.",
    );
  });
});
