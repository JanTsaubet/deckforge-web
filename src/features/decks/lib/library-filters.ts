import type { Route } from "next";
import { routes } from "@/config/routes";
import { normalizeText } from "@/lib/utils/text";
import { DECK_FORMATS } from "../constants/deck-formats";
import { MAX_TAG_LENGTH, normalizeTag } from "../constants/deck-limits";
import type { DeckFormat, DeckSummary } from "../types/deck";

export const LIBRARY_SORTS = ["recent", "name"] as const;
export type LibrarySort = (typeof LIBRARY_SORTS)[number];

export const LIBRARY_VIEWS = ["grid", "list"] as const;
export type LibraryView = (typeof LIBRARY_VIEWS)[number];

/** Valor del filtro de carpeta para los mazos que no están en ninguna. */
export const UNFILED_FOLDER = "none";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Estado de la biblioteca. Vive en la URL (?folder=&tag=&q=&format=&sort=&view=): sobrevive a recargas,
 * se puede guardar en favoritos y el botón "atrás" funciona como se espera.
 */
export interface LibraryFilters {
  /** "" = todas; `UNFILED_FOLDER` = sin carpeta; si no, el id de la carpeta. */
  folder: string;
  tag: string;
  query: string;
  format: DeckFormat | "";
  sort: LibrarySort;
  view: LibraryView;
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  folder: "",
  tag: "",
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
  const folder = first(params.folder) ?? "";
  return {
    folder: folder === UNFILED_FOLDER || UUID_PATTERN.test(folder) ? folder : "",
    tag: normalizeTag(first(params.tag) ?? "").slice(0, MAX_TAG_LENGTH),
    query: first(params.q)?.trim() ?? "",
    format: oneOf<DeckFormat | "">(first(params.format), DECK_FORMATS, ""),
    sort: oneOf(first(params.sort), LIBRARY_SORTS, DEFAULT_LIBRARY_FILTERS.sort),
    view: oneOf(first(params.view), LIBRARY_VIEWS, DEFAULT_LIBRARY_FILTERS.view),
  };
}

/** Escribe los filtros en la URL omitiendo los valores por defecto, para que quede limpia. */
export function toLibrarySearchParams(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.folder) params.set("folder", filters.folder);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.query) params.set("q", filters.query);
  if (filters.format) params.set("format", filters.format);
  if (filters.sort !== DEFAULT_LIBRARY_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.view !== DEFAULT_LIBRARY_FILTERS.view) params.set("view", filters.view);
  return params;
}

/** URL de la biblioteca con esos filtros, para enlaces (carpetas, etiquetas…). */
export function libraryHref(filters: LibraryFilters): Route {
  const params = toLibrarySearchParams(filters).toString();
  return (params ? `${routes.decks}?${params}` : routes.decks) as Route;
}

const nameCollator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

export function applyLibraryFilters(decks: DeckSummary[], filters: LibraryFilters): DeckSummary[] {
  const query = normalizeText(filters.query);

  const visible = decks.filter(
    (deck) =>
      matchesFolder(deck, filters.folder) &&
      (!filters.tag || deck.tags.includes(filters.tag)) &&
      (!query || normalizeText(deck.name).includes(query)) &&
      (!filters.format || deck.format === filters.format),
  );

  return visible.sort((a, b) =>
    filters.sort === "name"
      ? nameCollator.compare(a.name, b.name)
      : // Las fechas ISO 8601 se ordenan bien como texto.
        b.updatedAt.localeCompare(a.updatedAt),
  );
}

function matchesFolder(deck: DeckSummary, folder: string): boolean {
  if (!folder) return true;
  if (folder === UNFILED_FOLDER) return !deck.folderId;
  return deck.folderId === folder;
}

/** Todas las etiquetas usadas en la biblioteca, en orden alfabético y sin repetir. */
export function collectTags(decks: DeckSummary[]): string[] {
  return [...new Set(decks.flatMap((deck) => deck.tags))].sort(nameCollator.compare);
}
