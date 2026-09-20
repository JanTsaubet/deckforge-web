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

/**
 * Dos cosas que jsdom no trae y que la interfaz da por hechas:
 *
 * - `<dialog>`: sin esto, cualquier test que abra un diálogo modal falla con "showModal is
 *   not a function". Se imita solo lo que usa la app: abrir, cerrar y el aviso de cierre.
 * - `ResizeObserver` y `scrollIntoView`: los usan las listas que se miden y se desplazan
 *   solas (la paleta de comandos). En un test nada se pinta ni se desplaza, así que basta
 *   con que existan y no hagan nada.
 *
 * Con `??=` para que ambos parches desaparezcan solos el día que jsdom los implemente.
 */
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
