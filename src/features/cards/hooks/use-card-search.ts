"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { cardQueryKeys } from "../api/card-query-keys";
import { fetchCardSearch } from "../api/cards-api-client";
import type { CardSortOrder } from "../types/card";

interface UseCardSearchOptions {
  /** Consulta con sintaxis de Scryfall. Si está vacía, no se lanza ninguna petición. */
  query: string;
  order?: CardSortOrder;
}

/**
 * Búsqueda paginada de cartas con scroll infinito.
 * Los resultados se consideran frescos una hora: repetir una búsqueda no vuelve a pedir datos.
 */
export function useCardSearch({ query, order = "name" }: UseCardSearchOptions) {
  const trimmedQuery = query.trim();

  return useInfiniteQuery({
    queryKey: cardQueryKeys.search({ query: trimmedQuery, order }),
    queryFn: ({ pageParam }) => fetchCardSearch({ query: trimmedQuery, page: pageParam, order }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: trimmedQuery.length > 0,
    staleTime: 60 * 60 * 1000,
    // Una consulta con sintaxis inválida siempre fallará: reintentar no sirve de nada.
    retry: false,
  });
}
