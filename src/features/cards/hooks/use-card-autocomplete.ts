"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cardQueryKeys } from "../api/card-query-keys";
import { fetchCardAutocomplete } from "../api/cards-api-client";

/** Mínimo de caracteres antes de pedir sugerencias (coincide con el Route Handler). */
const MIN_TERM_LENGTH = 2;

/** Caracteres propios de la sintaxis de Scryfall: `t:creature`, `mv<=3`, `o:"draw a card"`. */
const SCRYFALL_SYNTAX_PATTERN = /[:<>="]/;

/**
 * Sugerencias de nombres de carta mientras se escribe.
 * El término se retrasa 200 ms para no lanzar una petición por pulsación.
 */
export function useCardAutocomplete(term: string) {
  const debouncedTerm = useDebouncedValue(term.trim(), 200);

  return useQuery({
    queryKey: cardQueryKeys.autocomplete(debouncedTerm),
    queryFn: () => fetchCardAutocomplete(debouncedTerm),
    // El autocompletado busca nombres de carta: si el término ya es una consulta con
    // sintaxis, no hay nada que sugerir y la petición sería cuota de Scryfall desperdiciada.
    enabled:
      debouncedTerm.length >= MIN_TERM_LENGTH && !SCRYFALL_SYNTAX_PATTERN.test(debouncedTerm),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
