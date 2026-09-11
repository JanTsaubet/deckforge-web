"use client";

import { Search, SearchX, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { CardGrid } from "@/features/cards/components/card-grid";
import { useCardAutocomplete } from "@/features/cards/hooks/use-card-autocomplete";
import type { Card } from "@/features/cards/types/card";
import { useCardSearch } from "@/features/cards/hooks/use-card-search";
import { cn } from "@/lib/utils/cn";

/** Máximo de sugerencias visibles bajo la barra de búsqueda. */
const MAX_SUGGESTIONS = 8;

interface CardSearchPanelProps {
  /** Consulta inicial, leída de la URL para que las búsquedas se puedan compartir. */
  initialQuery: string;
}

/**
 * Barra de búsqueda de cartas con autocompletado y resultados paginados.
 * La consulta confirmada vive en la URL (`?q=`); el texto que se está escribiendo, en estado local.
 */
export function CardSearchPanel({ initialQuery }: CardSearchPanelProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [areSuggestionsOpen, setAreSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const { data: suggestions = [] } = useCardAutocomplete(inputValue);
  const search = useCardSearch({ query });

  const visibleSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);
  const cards = search.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = search.data?.pages[0]?.totalCount ?? 0;

  function runSearch(nextQuery: string) {
    const trimmed = nextQuery.trim();
    setQuery(trimmed);
    setInputValue(trimmed);
    setAreSuggestionsOpen(false);
    setActiveSuggestion(-1);

    const params = new URLSearchParams({ tab: "cards" });
    if (trimmed) params.set("q", trimmed);
    router.replace(`${routes.search}?${params}` as Route, { scroll: false });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Con una sugerencia resaltada por teclado, gana esa sobre el texto escrito.
    runSearch(visibleSuggestions[activeSuggestion] ?? inputValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setAreSuggestionsOpen(false);
      setActiveSuggestion(-1);
      return;
    }
    if (!areSuggestionsOpen || visibleSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % visibleSuggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current <= 0 ? visibleSuggestions.length - 1 : current - 1,
      );
    }
  }

  return (
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
              setAreSuggestionsOpen(true);
              setActiveSuggestion(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setAreSuggestionsOpen(true)}
            // El retardo permite que el clic sobre una sugerencia llegue antes de cerrarla.
            onBlur={() => window.setTimeout(() => setAreSuggestionsOpen(false), 120)}
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

          {areSuggestionsOpen && visibleSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg">
              {visibleSuggestions.map((name, index) => (
                <li key={name}>
                  <button
                    type="button"
                    // onMouseDown evita que el blur del input cancele el clic.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => runSearch(name)}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-sm transition-colors duration-150",
                      index === activeSuggestion
                        ? "bg-accent/20 text-foreground"
                        : "text-muted hover:bg-accent/10 hover:text-foreground",
                    )}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit">Buscar</Button>
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
        onRetry={() => void search.refetch()}
        onLoadMore={() => void search.fetchNextPage()}
      />
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
  onRetry,
  onLoadMore,
}: SearchResultsProps) {
  if (!query) {
    return (
      <EmptyState
        icon={Search}
        title="Busca entre todas las cartas de Magic"
        description="Acepta la sintaxis de Scryfall. Por ejemplo: t:creature c:g mv<=3"
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
        <div className="flex justify-center">
          {/* TODO(Fase 1): sustituir por scroll infinito con IntersectionObserver + virtualización. */}
          <Button variant="secondary" onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Cargando…" : "Cargar más cartas"}
          </Button>
        </div>
      )}
    </div>
  );
}
