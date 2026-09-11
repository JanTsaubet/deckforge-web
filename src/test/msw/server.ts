import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Servidor de MSW compartido por todos los tests (se arranca en vitest.setup.ts). */
export const server = setupServer(...handlers);
