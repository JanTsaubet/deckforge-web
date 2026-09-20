import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { routes } from "@/config/routes";
import { HttpError } from "@/lib/http/http-client";
import type { Deck } from "../types/deck";
import { createServerDeckRepository } from "./server-deck-repository";

/**
 * Carga un mazo para una pantalla del servidor, traduciendo los fallos de la API a lo que
 * toca en el navegador: pantalla de "no existe" o acceso.
 *
 * Un mazo privado ajeno responde 404 (no 403), así que quien no puede verlo ni siquiera sabe
 * que existe. `loginNext` es a dónde volver tras iniciar sesión.
 *
 * Va envuelto en `cache` porque cada pantalla lo pide dos veces —una para los metadatos y
 * otra para el contenido— y así la API solo se llama una vez por petición.
 */
export const loadDeckPage = cache(async (deckId: string, loginNext: Route): Promise<Deck> => {
  try {
    const repository = await createServerDeckRepository();
    return await repository.getById(deckId);
  } catch (error) {
    if (error instanceof HttpError) {
      // 400: el id ni siquiera tiene forma de id. Para quien navega, es lo mismo que no existir.
      if (error.status === 404 || error.status === 400) notFound();
      if (error.status === 401) {
        redirect(`${routes.login}?next=${encodeURIComponent(loginNext)}` as Route);
      }
    }
    throw error;
  }
});
