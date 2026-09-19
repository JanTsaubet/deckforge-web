"use client";

import { History, Search, SearchX, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { CardGrid } from "@/features/cards/components/card-grid";
import { useCardAutocomplete } from "@/features/cards/hooks/use-card-autocomplete";
import { useCardSearch } from "@/features/cards/hooks/use-card-search";
import type { Card } from "@/features/cards/types/card";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { cn } from "@/lib/utils/cn";
import { useSearchHistory } from "../hooks/use-search-history";
import { buildScryfallQuery, parseScryfallQuery, type CardFilters } from "../lib/scryfall-query";
import { CardFilterPanel } from "./card-filter-panel";
import { SyntaxHelp } from "./syntax-help";

/** Máximo de sugerencias visibles bajo la barra de búsqueda. */
const MAX_SUGGESTIONS = 8;

interface CardSearchPanelProps {
  /** Consulta inicial, leída de la URL para que las búsquedas se puedan compartir. */
  initialQuery: string;
}

interface RunSearchOptions {
  /** `false` para los cambios de filtro: cada clic no debe llenar el historial. */
  remember?: boolean;
}

/**
 * Búsqueda de cartas: filtros visuales, barra de texto con autocompletado, historial y
 * ayuda de sintaxis, y resultados.
 *
 * La consulta confirmada es la única fuente de verdad y vive en la URL (`?q=`). Los filtros
 * se derivan de ella, así que texto y controles no pueden contradecirse.
 */
export function CardSearchPanel({ initialQuery }: CardSearchPanelProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(-1);

  const searchHistory = useSearchHistory();
  const { data: suggestions = [] } = useCardAutocomplete(inputValue);
  const search = useCardSearch({ query });

  const filters = useMemo(() => parseScryfallQuery(query), [query]);
  const cards = search.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = search.data?.pages[0]?.totalCount ?? 0;
  const pageCount = search.data?.pages.length ?? 0;

  // Con la caja vacía se ofrecen las búsquedas recientes; al escribir, el autocompletado.
  const isShowingHistory = inputValue.trim() === "" && searchHistory.entries.length > 0;
  const dropdownItems: readonly string[] = isShowingHistory
    ? searchHistory.entries
    : suggestions.slice(0, MAX_SUGGESTIONS);

  // Referencia estable: si cambiara en cada render, el observador se recrearía sin parar.
  const { fetchNextPage } = search;
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  function runSearch(nextQuery: string, { remember = true }: RunSearchOptions = {}) {
    const trimmed = nextQuery.trim();
    setQuery(trimmed);
    setInputValue(trimmed);
    setIsDropdownOpen(false);
    setActiveItem(-1);
    if (remember) searchHistory.add(trimmed);

    const params = new URLSearchParams({ tab: "cards" });
    if (trimmed) params.set("q", trimmed);
    router.replace(`${routes.search}?${params}` as Route, { scroll: false });
  }

  /** Tocar un filtro reescribe la consulta y busca al instante. */
  function handleFiltersChange(nextFilters: CardFilters) {
    runSearch(buildScryfallQuery(nextFilters), { remember: false });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Con un elemento resaltado por teclado, gana ese sobre el texto escrito.
    runSearch(dropdownItems[activeItem] ?? inputValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
      setActiveItem(-1);
      return;
    }
    if (!isDropdownOpen || dropdownItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveItem((current) => (current + 1) % dropdownItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveItem((current) => (current <= 0 ? dropdownItems.length - 1 : current - 1));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
      <CardFilterPanel filters={filters} onChange={handleFiltersChange} />

      <div className="flex flex-col gap-6">
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="text"
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                setIsDropdownOpen(true);
                setActiveItem(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsDropdownOpen(true)}
              // El retardo permite que el clic sobre un elemento llegue antes de cerrar la lista.
              onBlur={() => window.setTimeout(() => setIsDropdownOpen(false), 120)}
              placeholder="Busca cartas: t:creature c:g mv<=3"
              aria-label="Buscar cartas"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-border bg-surface px-9 text-sm transition-colors duration-200 outline-none placeholder:text-muted/70 focus:border-accent"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => runSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted transition-colors duration-200 hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}

            {isDropdownOpen && dropdownItems.length > 0 && (
              <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg">
                {isShowingHistory && (
                  <div className="flex items-center justify-between px-3 pt-2 pb-1">
                    <p className="text-xs font-medium text-muted">Búsquedas recientes</p>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={searchHistory.clear}
                      className="text-xs text-muted transition-colors duration-200 hover:text-foreground"
                    >
                      Borrar
                    </button>
                  </div>
                )}
                <ul>
                  {dropdownItems.map((item, index) => (
                    <li key={item}>
                      <button
                        type="button"
                        // onMouseDown evita que el blur del input cancele el clic.
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => runSearch(item)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-150",
                          index === activeItem
                            ? "bg-accent/20 text-foreground"
                            : "text-muted hover:bg-accent/10 hover:text-foreground",
                        )}
                      >
                        {isShowingHistory && <History className="size-3.5 shrink-0" aria-hidden />}
                        <span className="truncate">{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <SyntaxHelp onPick={(example) => runSearch(`${inputValue} ${example}`)} />
          <Button type="submit" className="h-11">
            Buscar
          </Button>
        </form>

        <SearchResults
          query={query}
          cards={cards}
          totalCount={totalCount}
          isPending={search.isPending}
          isError={search.isError}
          error={search.error}
          hasNextPage={search.hasNextPage}
          isFetchingNextPage={search.isFetchingNextPage}
          pageCount={pageCount}
          onRetry={() => void search.refetch()}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
}

interface SearchResultsProps {
  query: string;
  cards: Card[];
  totalCount: number;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  pageCount: number;
  onRetry: () => void;
  onLoadMore: () => void;
}

/** Estados de la zona de resultados: sin consulta, cargando, error, vacío o rejilla. */
function SearchResults({
  query,
  cards,
  totalCount,
  isPending,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  pageCount,
  onRetry,
  onLoadMore,
}: SearchResultsProps) {
  if (!query) {
    return (
      <EmptyState
        icon={Search}
        title="Busca entre todas las cartas de Magic"
        description="Usa los filtros de la izquierda, escribe con la sintaxis de Scryfall (t:creature c:g mv<=3) o abre la ayuda con el botón ?."
      />
    );
  }

  if (isPending) {
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <li key={index}>
            <Skeleton className="aspect-[5/7]" />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/10 p-4">
        <p className="text-sm font-medium">No se ha podido completar la búsqueda</p>
        <p className="mt-1 text-sm text-muted">
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Sin resultados"
        description="Ninguna carta coincide con esa consulta. Prueba a quitar alguna condición."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        {totalCount.toLocaleString("es-ES")}{" "}
        {totalCount === 1 ? "carta encontrada" : "cartas encontradas"}
      </p>
      <CardGrid cards={cards} />
      {hasNextPage && (
        <LoadMoreSection
          pageCount={pageCount}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={onLoadMore}
        />
      )}
    </div>
  );
}

/** Páginas que se cargan solas al hacer scroll antes de exigir un clic. */
const MAX_AUTO_LOADED_PAGES = 5;

interface LoadMoreSectionProps {
  pageCount: number;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

/**
 * Pide la página siguiente al acercarse el final de la lista.
 *
 * Pasadas varias páginas la carga automática se detiene y hace falta pulsar: así bajar
 * rápido con la rueda no arrastra miles de cartas ni tantas peticiones a Scryfall.
 * El botón se mantiene siempre porque es la vía accesible con teclado.
 */
function LoadMoreSection({ pageCount, isFetchingNextPage, onLoadMore }: LoadMoreSectionProps) {
  const canAutoLoad = pageCount < MAX_AUTO_LOADED_PAGES && !isFetchingNextPage;
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(onLoadMore, { enabled: canAutoLoad });

  return (
    <div ref={sentinelRef} className="flex flex-col items-center gap-2 py-4">
      {isFetchingNextPage ? (
        <p role="status" className="text-sm text-muted">
          Cargando más cartas…
        </p>
      ) : (
        <Button variant="secondary" onClick={onLoadMore}>
          Cargar más cartas
        </Button>
      )}
      {!canAutoLoad && !isFetchingNextPage && (
        <p className="text-xs text-muted">
          La carga automática se detiene tras {MAX_AUTO_LOADED_PAGES} páginas.
        </p>
      )}
    </div>
  );
}
