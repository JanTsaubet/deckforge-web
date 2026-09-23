"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDeckVersions } from "../api/deck-versions";

/**
 * Historial del mazo. Solo se pide cuando se abre (`enabled`), y siempre se vuelve a pedir:
 * entre una consulta y la siguiente lo normal es haber cambiado el mazo, que es justo lo que
 * se quiere ver.
 */
export function useDeckVersions(deckId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["decks", deckId, "versions"],
    queryFn: ({ signal }) => fetchDeckVersions(deckId, signal),
    enabled,
    staleTime: 0,
    retry: false,
  });
}
