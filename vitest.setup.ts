import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./src/test/msw/server";

/**
 * MSW intercepta todas las peticiones HTTP de los tests.
 * `onUnhandledRequest: "error"` es deliberado: si un test intenta salir a la red de verdad
 * (por ejemplo a la API de Scryfall), falla en lugar de volverse lento e inestable.
 */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
