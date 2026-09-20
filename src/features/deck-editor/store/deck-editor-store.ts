import { createStore } from "zustand/vanilla";
import type { EntryChange } from "@/features/decks/services/deck-repository";
import type { CatalogCard, DeckBoard, DeckCardLine } from "@/features/decks/types/deck";
import { addCopies, diffEntries, entryKey, moveCard, setQuantity } from "../lib/editor-entries";

/** Pasos que se pueden deshacer. Suficientes para cualquier sesión, sin crecer sin límite. */
const HISTORY_LIMIT = 100;

/**
 * - `saved`: todo guardado.
 * - `pending`: hay cambios esperando a enviarse (se agrupan unos instantes).
 * - `saving`: enviando.
 * - `error`: el último envío falló; los cambios siguen pendientes y se reintentarán.
 */
export type SaveStatus = "saved" | "pending" | "saving" | "error";

export interface DeckEditorState {
  entries: DeckCardLine[];
  past: DeckCardLine[][];
  future: DeckCardLine[][];
  /**
   * Cambios sin guardar, uno por carta y zona: si una carta cambia tres veces antes de
   * guardarse, se envía solo su cantidad final.
   */
  pending: Record<string, EntryChange>;
  saveStatus: SaveStatus;
  saveError?: string;
  /** Carta bajo el ratón, para enseñar su imagen en grande. */
  previewCard?: CatalogCard;
}

export interface DeckEditorActions {
  setQuantity: (card: CatalogCard, board: DeckBoard, quantity: number) => void;
  addCopies: (card: CatalogCard, board: DeckBoard, delta: number) => void;
  moveCard: (card: CatalogCard, from: DeckBoard, to: DeckBoard) => void;
  undo: () => void;
  redo: () => void;
  setPreviewCard: (card: CatalogCard | undefined) => void;
  /** Saca los cambios pendientes para enviarlos (y marca que se está guardando). */
  beginSave: () => EntryChange[];
  /** La API ha guardado `sent`: deja de estar pendiente lo que no haya cambiado desde entonces. */
  saveSucceeded: (sent: EntryChange[]) => void;
  saveFailed: (message: string) => void;
  /** Reintentar ya un guardado fallido, sin esperar al reintento automático. */
  retrySave: () => void;
}

export type DeckEditorStore = DeckEditorState & DeckEditorActions;

/**
 * Estado del editor de un mazo. Los cambios se ven al instante (UI optimista) y se guardan
 * después en segundo plano (ver `useAutosave`). Deshacer y rehacer son cambios como
 * cualquier otro: vuelven a un estado anterior y guardan la diferencia.
 */
export function createDeckEditorStore(initialEntries: DeckCardLine[]) {
  return createStore<DeckEditorStore>()((set, get) => {
    /** Aplica un estado nuevo: lo guarda en el historial y apunta qué hay que enviar. */
    function commit(next: DeckCardLine[], history: Pick<DeckEditorState, "past" | "future">) {
      const { entries, pending } = get();
      if (next === entries) return;
      const changes = diffEntries(entries, next);
      if (changes.length === 0) return;

      const merged = { ...pending };
      for (const change of changes) merged[entryKey(change.board, change.cardId)] = change;

      set({
        entries: next,
        ...history,
        pending: merged,
        saveStatus: get().saveStatus === "saving" ? "saving" : "pending",
      });
    }

    function edit(update: (entries: DeckCardLine[]) => DeckCardLine[]) {
      const { entries, past } = get();
      commit(update(entries), { past: [...past, entries].slice(-HISTORY_LIMIT), future: [] });
    }

    return {
      entries: initialEntries,
      past: [],
      future: [],
      pending: {},
      saveStatus: "saved",

      setQuantity: (card, board, quantity) =>
        edit((entries) => setQuantity(entries, card, board, quantity)),
      addCopies: (card, board, delta) => edit((entries) => addCopies(entries, card, board, delta)),
      moveCard: (card, from, to) => edit((entries) => moveCard(entries, card, from, to)),

      undo: () => {
        const { entries, past, future } = get();
        const previous = past.at(-1);
        if (!previous) return;
        commit(previous, { past: past.slice(0, -1), future: [entries, ...future] });
      },

      redo: () => {
        const { entries, past, future } = get();
        const [next, ...rest] = future;
        if (!next) return;
        commit(next, { past: [...past, entries], future: rest });
      },

      setPreviewCard: (card) => set({ previewCard: card }),

      beginSave: () => {
        const changes = Object.values(get().pending);
        if (changes.length > 0) set({ saveStatus: "saving", saveError: undefined });
        return changes;
      },

      saveSucceeded: (sent) => {
        const pending = { ...get().pending };
        for (const change of sent) {
          const key = entryKey(change.board, change.cardId);
          // Si cambió mientras se guardaba, sigue pendiente con su valor nuevo.
          if (pending[key]?.quantity === change.quantity) delete pending[key];
        }
        set({ pending, saveStatus: Object.keys(pending).length > 0 ? "pending" : "saved" });
      },

      saveFailed: (message) => set({ saveStatus: "error", saveError: message }),

      retrySave: () => {
        if (get().saveStatus === "error") set({ saveStatus: "pending", saveError: undefined });
      },
    };
  });
}

export type DeckEditorStoreApi = ReturnType<typeof createDeckEditorStore>;
