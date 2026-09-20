"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { searchCatalog, type IdentityFilter } from "../api/catalog-search";

/** Mínimo de caracteres para buscar (el de la API). */
export const MIN_QUERY_LENGTH = 2;

/**
 * Cartas del catálogo que coinciden con lo escrito. Espera 150 ms entre pulsaciones y
 * mantiene los resultados anteriores mientras llegan los nuevos, para que la lista no
 * parpadee al escribir.
 */
export function useCatalogSearch(query: string, identity: IdentityFilter) {
  const debounced = useDebouncedValue(query.trim(), 150);

  return useQuery({
    queryKey: ["catalog", "search", debounced, identity?.join("") ?? "*"],
    queryFn: ({ signal }) => searchCatalog(debounced, identity, signal),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
