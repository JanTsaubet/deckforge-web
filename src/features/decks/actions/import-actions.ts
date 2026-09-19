"use server";

import { getSessionCookie } from "better-auth/cookies";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { routes } from "@/config/routes";
import { createScryfallCardRepository } from "@/features/cards/api/scryfall-card-repository";
import { createServerDeckRepository } from "../api/server-deck-repository";
import { DECK_BOARDS, DECK_FORMATS, DECK_VISIBILITIES } from "../constants/deck-formats";
import {
  MAX_DECK_ENTRIES,
  MAX_DECK_NAME_LENGTH,
  MAX_DECKLIST_LENGTH,
  MAX_ENTRY_QUANTITY,
} from "../constants/deck-limits";
import { parseDecklist, type DecklistParseResult } from "../lib/decklist-parser";
import { resolveDecklist, type DecklistResolution } from "../lib/resolve-decklist";
import { describeApiError, type ActionResult } from "./action-errors";

export interface DecklistPreview extends DecklistResolution {
  invalidLines: DecklistParseResult["invalidLines"];
  deckName?: string;
}

export type PreviewDecklistResult =
  { ok: true; preview: DecklistPreview } | { ok: false; error: string };

const previewSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Pega primero la lista de cartas.")
    .max(MAX_DECKLIST_LENGTH, "La lista es demasiado larga."),
  format: z.enum(DECK_FORMATS),
});

/**
 * Interpreta la lista y busca sus cartas en Scryfall, sin guardar nada: es la vista previa
 * que se revisa antes de crear el mazo.
 *
 * Una Server Action es un endpoint público. Exigir sesión y limitar el tamaño evita que se
 * use para lanzar consultas a Scryfall en nuestro nombre.
 */
export async function previewDecklistAction(
  text: string,
  format: string,
): Promise<PreviewDecklistResult> {
  if (!getSessionCookie(await headers())) {
    return { ok: false, error: "Inicia sesión para importar mazos." };
  }

  const parsed = previewSchema.safeParse({ text, format });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const { lines, invalidLines, deckName } = parseDecklist(parsed.data.text, {
    format: parsed.data.format,
  });
  if (lines.length === 0) {
    return { ok: false, error: "No se ha reconocido ninguna carta en la lista." };
  }
  if (lines.length > MAX_DECK_ENTRIES) {
    return { ok: false, error: `La lista admite como mucho ${MAX_DECK_ENTRIES} líneas de cartas.` };
  }

  try {
    const resolution = await resolveDecklist(lines, createScryfallCardRepository());
    return { ok: true, preview: { ...resolution, invalidLines, deckName } };
  } catch (error) {
    console.error("Fallo al resolver una lista en Scryfall", error);
    return {
      ok: false,
      error: "No se ha podido consultar el catálogo de cartas. Inténtalo de nuevo en un momento.",
    };
  }
}

const importSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ponle un nombre al mazo.")
    .max(MAX_DECK_NAME_LENGTH, `El nombre admite como mucho ${MAX_DECK_NAME_LENGTH} caracteres.`),
  format: z.enum(DECK_FORMATS),
  visibility: z.enum(DECK_VISIBILITIES),
  entries: z
    .array(
      z.object({
        cardId: z.uuid(),
        board: z.enum(DECK_BOARDS),
        quantity: z.int().min(1).max(MAX_ENTRY_QUANTITY),
      }),
    )
    .min(1, "El mazo no tiene ninguna carta que importar.")
    .max(MAX_DECK_ENTRIES),
});

export type ImportDeckInput = z.input<typeof importSchema>;

export interface ImportDeckResult extends ActionResult {
  deckId?: string;
}

/** Crea el mazo con las cartas ya resueltas de la vista previa, en una sola petición. */
export async function importDeckAction(input: ImportDeckInput): Promise<ImportDeckResult> {
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  let deckId: string;
  try {
    const repository = await createServerDeckRepository();
    deckId = (await repository.create(parsed.data)).id;
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }

  revalidatePath(routes.decks);
  return { ok: true, deckId };
}
