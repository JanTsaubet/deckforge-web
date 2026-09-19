"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils/cn";
import { DECK_FORMAT_LABELS, DECK_FORMATS } from "../constants/deck-formats";
import {
  toLibrarySearchParams,
  type LibraryFilters,
  type LibrarySort,
  type LibraryView,
} from "../lib/library-filters";
import type { DeckFormat } from "../types/deck";

const SORT_LABELS: Record<LibrarySort, string> = {
  recent: "Más recientes",
  name: "Nombre (A-Z)",
};

const VIEW_OPTIONS: ReadonlyArray<{ view: LibraryView; label: string; icon: typeof List }> = [
  { view: "grid", label: "Vista en rejilla", icon: LayoutGrid },
  { view: "list", label: "Vista en lista", icon: List },
];

const CONTROL =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors duration-200 focus:border-accent";

interface LibraryToolbarProps {
  filters: LibraryFilters;
  resultCount: number;
  totalCount: number;
}

/**
 * Búsqueda, filtro, orden y tipo de vista de la biblioteca. No filtra nada por sí misma:
 * reescribe la URL, y la página (en el servidor) aplica los filtros.
 */
export function LibraryToolbar({ filters, resultCount, totalCount }: LibraryToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(filters.query);
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const update = useCallback(
    (changes: Partial<LibraryFilters>) => {
      const params = toLibrarySearchParams({ ...filters, ...changes }).toString();
      router.replace((params ? `${pathname}?${params}` : pathname) as Route, { scroll: false });
    },
    [filters, pathname, router],
  );

  // El texto se aplica con un pequeño retardo: una navegación por pulsación sería demasiado.
  useEffect(() => {
    if (debouncedQuery !== filters.query) update({ query: debouncedQuery });
  }, [debouncedQuery, filters.query, update]);

  const countLabel =
    resultCount === totalCount
      ? `${totalCount} ${totalCount === 1 ? "mazo" : "mazos"}`
      : `${resultCount} de ${totalCount}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <span className="sr-only">Buscar en tus mazos</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre…"
          className={cn(CONTROL, "w-full pl-9")}
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Formato"
          value={filters.format}
          onChange={(event) => update({ format: event.target.value as DeckFormat | "" })}
          className={CONTROL}
        >
          <option value="">Todos los formatos</option>
          {DECK_FORMATS.map((format) => (
            <option key={format} value={format}>
              {DECK_FORMAT_LABELS[format]}
            </option>
          ))}
        </select>

        <select
          aria-label="Ordenar"
          value={filters.sort}
          onChange={(event) => update({ sort: event.target.value as LibrarySort })}
          className={CONTROL}
        >
          {Object.entries(SORT_LABELS).map(([sort, label]) => (
            <option key={sort} value={sort}>
              {label}
            </option>
          ))}
        </select>

        <div
          role="group"
          aria-label="Vista"
          className="flex rounded-lg border border-border bg-surface p-0.5"
        >
          {VIEW_OPTIONS.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              type="button"
              aria-label={label}
              title={label}
              aria-pressed={filters.view === view}
              onClick={() => update({ view })}
              className={cn(
                "grid size-8 place-items-center rounded-md transition-colors duration-200",
                filters.view === view
                  ? "bg-surface-raised text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>

        <p className="text-xs text-muted" aria-live="polite">
          {countLabel}
        </p>
      </div>
    </div>
  );
}
