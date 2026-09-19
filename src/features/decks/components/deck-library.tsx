import { Layers, SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { applyLibraryFilters, type LibraryFilters } from "../lib/library-filters";
import type { DeckSummary } from "../types/deck";
import { CreateDeckDialog } from "./create-deck-dialog";
import { DeckCard } from "./deck-card";
import { DeckListTable } from "./deck-list-table";
import { LibraryToolbar } from "./library-toolbar";

interface DeckLibraryProps {
  decks: DeckSummary[];
  filters: LibraryFilters;
}

/** Biblioteca: barra de herramientas y mazos en rejilla o lista (o el estado vacío que toque). */
export function DeckLibrary({ decks, filters }: DeckLibraryProps) {
  if (decks.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Aún no tienes mazos"
        description="Crea tu primer mazo desde cero. Pronto también podrás importar una lista en texto (MTGA/MTGO)."
        action={<CreateDeckDialog triggerLabel="Crear mi primer mazo" />}
      />
    );
  }

  const visible = applyLibraryFilters([...decks], filters);

  return (
    <div className="flex flex-col gap-6">
      <LibraryToolbar filters={filters} resultCount={visible.length} totalCount={decks.length} />

      {visible.length === 0 ? (
        // Distinto del estado vacío de arriba: los mazos existen, pero el filtro los esconde.
        <EmptyState
          icon={SearchX}
          title="Ningún mazo coincide"
          description="Prueba con otro nombre o quita el filtro de formato."
        />
      ) : filters.view === "list" ? (
        <DeckListTable decks={visible} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((deck) => (
            <li key={deck.id}>
              <DeckCard deck={deck} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
