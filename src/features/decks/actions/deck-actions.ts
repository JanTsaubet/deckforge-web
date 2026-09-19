"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { routes } from "@/config/routes";
import { HttpError } from "@/lib/http/http-client";
import { createServerDeckRepository } from "../api/server-deck-repository";
import { DECK_FORMATS, DECK_VISIBILITIES } from "../constants/deck-formats";

/** Resultado de una acción: se devuelve en vez de lanzar, para mostrarlo en el formulario. */
export interface DeckActionResult {
  ok: boolean;
  error?: string;
}

const createDeckSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre al mazo.")
    .max(100, "El nombre admite como mucho 100 caracteres."),
  format: z.enum(DECK_FORMATS),
  visibility: z.enum(DECK_VISIBILITIES),
});

/**
 * Crea un mazo. Firma pensada para `useActionState`.
 * Los permisos no se comprueban aquí: la API decide con la cookie de la sesión.
 */
export async function createDeckAction(
  _previous: DeckActionResult | null,
  formData: FormData,
): Promise<DeckActionResult> {
  const parsed = createDeckSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  try {
    const repository = await createServerDeckRepository();
    await repository.create(parsed.data);
  } catch (error) {
    return { ok: false, error: describeDeckError(error) };
  }

  revalidatePath(routes.decks);
  return { ok: true };
}

export async function deleteDeckAction(deckId: string): Promise<DeckActionResult> {
  try {
    const repository = await createServerDeckRepository();
    await repository.remove(deckId);
  } catch (error) {
    return { ok: false, error: describeDeckError(error) };
  }

  revalidatePath(routes.decks);
  return { ok: true };
}

function describeDeckError(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 401) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
    if (error.status === 404) return "Ese mazo ya no existe.";
  }
  console.error("Fallo al guardar un mazo", error);
  return "No se ha podido guardar el cambio. Inténtalo de nuevo.";
}
