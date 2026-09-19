import { createServerApiClient } from "@/lib/api/server-api";
import type { DeckRepository } from "../services/deck-repository";
import type { FolderRepository } from "../services/folder-repository";
import { HttpDeckRepository } from "./http-deck-repository";
import { HttpFolderRepository } from "./http-folder-repository";

/**
 * Repositorio de mazos para el servidor, actuando en nombre del usuario de la petición.
 * Separado de `HttpDeckRepository` para que este se pueda probar sin Next.js.
 */
export async function createServerDeckRepository(): Promise<DeckRepository> {
  return new HttpDeckRepository(await createServerApiClient());
}

export async function createServerFolderRepository(): Promise<FolderRepository> {
  return new HttpFolderRepository(await createServerApiClient());
}
