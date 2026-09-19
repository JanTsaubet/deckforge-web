"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { routes } from "@/config/routes";
import { createServerDeckRepository } from "../api/server-deck-repository";
import { DECK_FORMATS, DECK_VISIBILITIES } from "../constants/deck-formats";
import {
  MAX_DECK_NAME_LENGTH,
  MAX_DECK_TAGS,
  MAX_TAG_LENGTH,
  normalizeTag,
} from "../constants/deck-limits";
import { describeApiError, type ActionResult } from "./action-errors";

export type DeckActionResult = ActionResult;

const createDeckSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre al mazo.")
    .max(MAX_DECK_NAME_LENGTH, `El nombre admite como mucho ${MAX_DECK_NAME_LENGTH} caracteres.`),
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
    return { ok: false, error: describeApiError(error) };
  }

  revalidatePath(routes.decks);
  return { ok: true };
}

export async function deleteDeckAction(deckId: string): Promise<DeckActionResult> {
  try {
    const repository = await createServerDeckRepository();
    await repository.remove(deckId);
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }

  revalidatePath(routes.decks);
  return { ok: true };
}

export interface DuplicateDeckResult extends DeckActionResult {
  /** Nombre de la copia, para el aviso de confirmación. */
  copyName?: string;
}

export async function duplicateDeckAction(deckId: string): Promise<DuplicateDeckResult> {
  let copyName: string;
  try {
    const repository = await createServerDeckRepository();
    copyName = (await repository.duplicate(deckId)).name;
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }

  revalidatePath(routes.decks);
  return { ok: true, copyName };
}

const organizeDeckSchema = z.object({
  folderId: z.uuid().nullable(),
  tags: z
    .array(
      z
        .string()
        .transform(normalizeTag)
        .pipe(
          z
            .string()
            .min(1)
            .max(MAX_TAG_LENGTH, `Cada etiqueta admite como mucho ${MAX_TAG_LENGTH} caracteres.`),
        ),
    )
    .max(MAX_DECK_TAGS, `Un mazo admite como mucho ${MAX_DECK_TAGS} etiquetas.`),
});

export type OrganizeDeckInput = z.input<typeof organizeDeckSchema>;

/** Mueve un mazo de carpeta y cambia sus etiquetas. */
export async function organizeDeckAction(
  deckId: string,
  input: OrganizeDeckInput,
): Promise<DeckActionResult> {
  const parsed = organizeDeckSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  try {
    const repository = await createServerDeckRepository();
    await repository.update(deckId, parsed.data);
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }

  revalidatePath(routes.decks);
  return { ok: true };
}
