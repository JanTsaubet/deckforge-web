import { create } from "zustand";
import type { DeckBoard, DeckEntry } from "@/features/decks/types/deck";

interface DeckEditorState {
  deckId: string | null;
  entries: DeckEntry[];
  /** `true` si hay cambios pendientes de guardar. */
  isDirty: boolean;
}

interface DeckEditorActions {
  loadDeck: (deckId: string, entries: DeckEntry[]) => void;
  addCard: (cardId: string, board?: DeckBoard) => void;
  removeCard: (cardId: string, board?: DeckBoard) => void;
  markSaved: () => void;
}

export type DeckEditorStore = DeckEditorState & DeckEditorActions;

const isSameEntry = (entry: DeckEntry, cardId: string, board: DeckBoard) =>
  entry.cardId === cardId && entry.board === board;

/**
 * Estado del editor de mazos (solo cliente).
 * Los cambios se aplican al instante (UI optimista) y se sincronizarán con la API
 * en segundo plano en la Fase 3. Solo se muta desde componentes cliente, por lo que
 * no hay estado compartido entre peticiones en el servidor.
 */
export const useDeckEditorStore = create<DeckEditorStore>()((set) => ({
  deckId: null,
  entries: [],
  isDirty: false,

  loadDeck: (deckId, entries) => set({ deckId, entries, isDirty: false }),

  addCard: (cardId, board = "main") =>
    set((state) => {
      const exists = state.entries.some((entry) => isSameEntry(entry, cardId, board));
      const entries = exists
        ? state.entries.map((entry) =>
            isSameEntry(entry, cardId, board) ? { ...entry, quantity: entry.quantity + 1 } : entry,
          )
        : [...state.entries, { cardId, board, quantity: 1, tags: [] }];
      return { entries, isDirty: true };
    }),

  removeCard: (cardId, board = "main") =>
    set((state) => ({
      entries: state.entries
        .map((entry) =>
          isSameEntry(entry, cardId, board) ? { ...entry, quantity: entry.quantity - 1 } : entry,
        )
        .filter((entry) => entry.quantity > 0),
      isDirty: true,
    })),

  markSaved: () => set({ isDirty: false }),
}));
