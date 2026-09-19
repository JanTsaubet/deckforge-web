import { http, HttpResponse } from "msw";
import { connection } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { loadSocialProviders } from "./load-social-providers";

// Fuera de una petición real de Next, `connection()` no tiene nada que marcar como dinámico.
vi.mock("next/server", () => ({ connection: vi.fn().mockResolvedValue(undefined) }));

const PROVIDERS_URL = "http://localhost:4000/v1/auth/providers";

describe("loadSocialProviders", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve los proveedores que la API tiene configurados", async () => {
    server.use(http.get(PROVIDERS_URL, () => HttpResponse.json({ social: ["google"] })));

    await expect(loadSocialProviders()).resolves.toEqual(["google"]);
  });

  it("marca la página como dinámica, para no congelar los proveedores al compilar", async () => {
    server.use(http.get(PROVIDERS_URL, () => HttpResponse.json({ social: [] })));

    await loadSocialProviders();

    expect(connection).toHaveBeenCalled();
  });

  it("si la API falla, no ofrece ningún proveedor en lugar de romper la página", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get(PROVIDERS_URL, () => HttpResponse.json({}, { status: 500 })));

    await expect(loadSocialProviders()).resolves.toEqual([]);
  });
});
