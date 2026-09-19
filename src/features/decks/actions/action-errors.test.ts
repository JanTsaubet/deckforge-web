import { describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http/http-client";
import { describeApiError } from "./action-errors";

const httpError = (status: number, body: unknown = null) => new HttpError(status, "/v1/x", body);

describe("describeApiError", () => {
  it("usa el mensaje de la API cuando explica qué dato falla", () => {
    expect(
      describeApiError(httpError(409, { message: "Ya tienes una carpeta llamada «cEDH»" })),
    ).toBe("Ya tienes una carpeta llamada «cEDH».");
    expect(describeApiError(httpError(400, { message: ["name must be shorter", "otro"] }))).toBe(
      "name must be shorter.",
    );
  });

  it("traduce sesión caducada y recurso inexistente", () => {
    expect(describeApiError(httpError(401))).toMatch(/sesión/);
    expect(describeApiError(httpError(404), "Esa carpeta ya no existe.")).toBe(
      "Esa carpeta ya no existe.",
    );
  });

  it("no enseña detalles internos de un fallo inesperado", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(describeApiError(httpError(500, { message: "stack interno" }))).toBe(
      "No se ha podido guardar el cambio. Inténtalo de nuevo.",
    );
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
