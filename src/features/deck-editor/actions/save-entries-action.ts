"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { routes } from "@/config/routes";
import { describeApiError, type ActionResult } from "@/features/decks/actions/action-errors";
import { createServerDeckRepository } from "@/features/decks/api/server-deck-repository";
import { DECK_BOARDS } from "@/features/decks/constants/deck-formats";
import type { EntryChange } from "@/features/decks/services/deck-repository";

/** Mismo límite que la API: el guardado automático nunca envía tantos de golpe. */
const MAX_CHANGES = 200;

const changesSchema = z
  .array(
    z.object({
      cardId: z.uuid(),
      board: z.enum(DECK_BOARDS),
      quantity: z.int().min(0).max(999),
    }),
  )
  .min(1)
  .max(MAX_CHANGES);

/** Guarda los cambios de cartas del editor. Los permisos los decide la API con la sesión. */
export async function saveEntriesAction(
  deckId: string,
  changes: EntryChange[],
): Promise<ActionResult> {
  const parsed = changesSchema.safeParse(changes);
  if (!parsed.success) return { ok: false, error: "Cambios no válidos." };

  try {
    const repository = await createServerDeckRepository();
    await repository.updateEntries(deckId, parsed.data);
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }

  // La biblioteca muestra el número de cartas, la identidad y la portada: han podido cambiar.
  revalidatePath(routes.decks);
  revalidatePath(routes.deck(deckId));
  return { ok: true };
}
