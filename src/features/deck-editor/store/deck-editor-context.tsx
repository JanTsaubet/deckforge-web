"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import type { DeckCardLine } from "@/features/decks/types/deck";
import {
  createDeckEditorStore,
  type DeckEditorStore,
  type DeckEditorStoreApi,
} from "./deck-editor-store";

const DeckEditorContext = createContext<DeckEditorStoreApi | null>(null);

/**
 * Un store por editor abierto (y no uno global): al pasar de un mazo a otro no queda estado
 * del anterior, y en el servidor no hay estado compartido entre peticiones.
 */
export function DeckEditorProvider({
  initialEntries,
  children,
}: {
  initialEntries: DeckCardLine[];
  children: ReactNode;
}) {
  const [store] = useState(() => createDeckEditorStore(initialEntries));
  return <DeckEditorContext value={store}>{children}</DeckEditorContext>;
}

export function useDeckEditorStoreApi(): DeckEditorStoreApi {
  const store = useContext(DeckEditorContext);
  if (!store) throw new Error("useDeckEditor debe usarse dentro de <DeckEditorProvider>");
  return store;
}

/** Lee del store del editor. Solo vuelve a pintar si cambia lo que selecciona. */
export function useDeckEditor<T>(selector: (state: DeckEditorStore) => T): T {
  return useStore(useDeckEditorStoreApi(), selector);
}
