import { createServerApiClient } from "@/lib/api/server-api";
import type { DeckRepository } from "../services/deck-repository";
import { HttpDeckRepository } from "./http-deck-repository";

/**
 * Repositorio de mazos para el servidor, actuando en nombre del usuario de la petición.
 * Separado de `HttpDeckRepository` para que este se pueda probar sin Next.js.
 */
export async function createServerDeckRepository(): Promise<DeckRepository> {
  return new HttpDeckRepository(await createServerApiClient());
}
