import type { CardSortOrder } from "../types/card";

/**
 * Claves de caché de TanStack Query, centralizadas para poder invalidar por familias
 * (`cardQueryKeys.all` invalida todo lo relacionado con cartas).
 */
export const cardQueryKeys = {
  all: ["cards"] as const,
  search: (params: { query: string; order: CardSortOrder }) =>
    [...cardQueryKeys.all, "search", params] as const,
  autocomplete: (term: string) => [...cardQueryKeys.all, "autocomplete", term] as const,
};
