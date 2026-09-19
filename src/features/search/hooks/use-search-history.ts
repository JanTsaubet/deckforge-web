"use client";

import { useSyncExternalStore } from "react";
import { searchHistoryStore } from "../lib/search-history-store";

/** Búsquedas recientes de este navegador y las acciones para gestionarlas. */
export function useSearchHistory() {
  const entries = useSyncExternalStore(
    searchHistoryStore.subscribe,
    searchHistoryStore.getSnapshot,
    searchHistoryStore.getServerSnapshot,
  );

  return {
    entries,
    add: searchHistoryStore.add,
    remove: searchHistoryStore.remove,
    clear: searchHistoryStore.clear,
  };
}
