import { FolderOpen, Layers, SearchX, Upload } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { routes } from "@/config/routes";
import {
  applyLibraryFilters,
  collectTags,
  DEFAULT_LIBRARY_FILTERS,
  libraryHref,
  type LibraryFilters,
} from "../lib/library-filters";
import type { DeckFolder, DeckSummary } from "../types/deck";
import { CreateDeckDialog } from "./create-deck-dialog";
import { DeckCard } from "./deck-card";
import { DeckListTable } from "./deck-list-table";
import { FolderNav } from "./folder-nav";
import { LibraryToolbar } from "./library-toolbar";

interface DeckLibraryProps {
  decks: DeckSummary[];
  folders: DeckFolder[];
  filters: LibraryFilters;
}

/**
 * Biblioteca: carpetas a un lado, y a otro la barra de herramientas y los mazos en rejilla o
 * lista (o el estado vacío que toque).
 */
export function DeckLibrary({ decks, folders, filters }: DeckLibraryProps) {
  if (decks.length === 0 && folders.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Aún no tienes mazos"
        description="Crea tu primer mazo desde cero o importa una lista en texto de MTG Arena, MTGO o Moxfield."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={routes.deckImport} className={buttonStyles({ variant: "secondary" })}>
              <Upload className="size-4" aria-hidden />
              Importar
            </Link>
            <CreateDeckDialog triggerLabel="Crear mi primer mazo" />
          </div>
        }
      />
    );
  }

  const visible = applyLibraryFilters([...decks], filters);
  const knownTags = collectTags(decks);

  const byFolder: Record<string, number> = {};
  for (const deck of decks) {
    if (deck.folderId) byFolder[deck.folderId] = (byFolder[deck.folderId] ?? 0) + 1;
  }
  const counts = {
    all: decks.length,
    unfiled: decks.filter((deck) => !deck.folderId).length,
    byFolder,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <FolderNav folders={folders} filters={filters} counts={counts} />
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <LibraryToolbar
          filters={filters}
          tags={knownTags}
          resultCount={visible.length}
          totalCount={decks.length}
        />

        {visible.length === 0 ? (
          <NoResults filters={filters} />
        ) : filters.view === "list" ? (
          <DeckListTable
            decks={visible}
            folders={folders}
            knownTags={knownTags}
            filters={filters}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((deck) => (
              <li key={deck.id}>
                <DeckCard deck={deck} folders={folders} knownTags={knownTags} filters={filters} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Sin resultados. Distinto del estado vacío de arriba: los mazos existen, pero la carpeta o
 * los filtros los esconden; y cada caso se explica a su manera.
 */
function NoResults({ filters }: { filters: LibraryFilters }) {
  const onlyFolder = filters.folder !== "" && !filters.tag && !filters.query && !filters.format;

  if (onlyFolder) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Esta carpeta está vacía"
        description="Mete mazos aquí con el botón «Carpeta y etiquetas» de cada mazo."
      />
    );
  }

  return (
    <EmptyState
      icon={SearchX}
      title="Ningún mazo coincide"
      description="Prueba con otro nombre, o quita la etiqueta o el filtro de formato."
      action={
        <Link
          // Se quitan los filtros, no la carpeta ni la forma de ver la biblioteca.
          href={libraryHref({
            ...DEFAULT_LIBRARY_FILTERS,
            folder: filters.folder,
            sort: filters.sort,
            view: filters.view,
          })}
          scroll={false}
          className={buttonStyles({ variant: "secondary", size: "sm" })}
        >
          Quitar filtros
        </Link>
      }
    />
  );
}
