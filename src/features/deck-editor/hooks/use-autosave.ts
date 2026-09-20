"use client";

import { useEffect } from "react";
import type { ActionResult } from "@/features/decks/actions/action-errors";
import type { EntryChange } from "@/features/decks/services/deck-repository";
import { useDeckEditor, useDeckEditorStoreApi } from "../store/deck-editor-context";

/** Espera tras el último cambio antes de guardar: agrupa las ráfagas de clics en un envío. */
export const SAVE_DELAY_MS = 700;

/** Espera antes de reintentar un guardado fallido. */
export const RETRY_DELAY_MS = 5000;

/** Máximo de cambios por envío (el de la API). Si hay más, se envían en varias tandas. */
const BATCH_SIZE = 200;

type SaveFn = (changes: EntryChange[]) => Promise<ActionResult>;

/**
 * Guardado automático del editor.
 *
 * Cuando hay cambios pendientes, espera un momento (por si llegan más) y los envía. Nunca hay
 * dos envíos a la vez: lo que cambie mientras se guarda sale en el siguiente. Si falla, lo
 * reintenta pasados unos segundos; los cambios no se pierden. Y si se intenta cerrar la
 * pestaña con cambios sin guardar, el navegador pide confirmación.
 */
export function useAutosave(save: SaveFn) {
  const store = useDeckEditorStoreApi();
  const status = useDeckEditor((state) => state.saveStatus);
  const pendingCount = useDeckEditor((state) => Object.keys(state.pending).length);

  useEffect(() => {
    if (pendingCount === 0 || status === "saving") return;

    const timer = window.setTimeout(
      async () => {
        const changes = store.getState().beginSave().slice(0, BATCH_SIZE);
        if (changes.length === 0) return;
        try {
          const result = await save(changes);
          if (result.ok) store.getState().saveSucceeded(changes);
          else store.getState().saveFailed(result.error ?? "No se ha podido guardar.");
        } catch {
          // Sin red, la acción ni siquiera llega al servidor.
          store.getState().saveFailed("Sin conexión. Se reintentará en unos segundos.");
        }
      },
      status === "error" ? RETRY_DELAY_MS : SAVE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pendingCount, status, save, store]);

  useEffect(() => {
    const hasUnsaved = pendingCount > 0 || status === "saving";
    if (!hasUnsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pendingCount, status]);
}
