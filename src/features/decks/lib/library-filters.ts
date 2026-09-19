import { DECK_FORMATS } from "../constants/deck-formats";
import type { DeckFormat, DeckSummary } from "../types/deck";

export const LIBRARY_SORTS = ["recent", "name"] as const;
export type LibrarySort = (typeof LIBRARY_SORTS)[number];

export const LIBRARY_VIEWS = ["grid", "list"] as const;
export type LibraryView = (typeof LIBRARY_VIEWS)[number];

/**
 * Estado de la biblioteca. Vive en la URL (?q=&format=&sort=&view=): sobrevive a recargas,
 * se puede guardar en favoritos y el botón "atrás" funciona como se espera.
 */
export interface LibraryFilters {
  query: string;
  format: DeckFormat | "";
  sort: LibrarySort;
  view: LibraryView;
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  query: "",
  format: "",
  sort: "recent",
  view: "grid",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Lee los filtros de la URL. Un valor inventado a mano no rompe nada: se usa el de por defecto. */
export function parseLibraryFilters(params: RawParams): LibraryFilters {
  return {
    query: first(params.q)?.trim() ?? "",
    format: oneOf<DeckFormat | "">(first(params.format), DECK_FORMATS, ""),
    sort: oneOf(first(params.sort), LIBRARY_SORTS, DEFAULT_LIBRARY_FILTERS.sort),
    view: oneOf(first(params.view), LIBRARY_VIEWS, DEFAULT_LIBRARY_FILTERS.view),
  };
}

/** Escribe los filtros en la URL omitiendo los valores por defecto, para que quede limpia. */
export function toLibrarySearchParams(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.format) params.set("format", filters.format);
  if (filters.sort !== DEFAULT_LIBRARY_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.view !== DEFAULT_LIBRARY_FILTERS.view) params.set("view", filters.view);
  return params;
}

/** Sin mayúsculas ni tildes: "atraxa" encuentra "Átraxa" y "Atraxa". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const nameCollator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

export function applyLibraryFilters(decks: DeckSummary[], filters: LibraryFilters): DeckSummary[] {
  const query = normalize(filters.query);

  const visible = decks.filter(
    (deck) =>
      (!query || normalize(deck.name).includes(query)) &&
      (!filters.format || deck.format === filters.format),
  );

  return visible.sort((a, b) =>
    filters.sort === "name"
      ? nameCollator.compare(a.name, b.name)
      : // Las fechas ISO 8601 se ordenan bien como texto.
        b.updatedAt.localeCompare(a.updatedAt),
  );
}
