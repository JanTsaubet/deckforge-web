import Link from "next/link";
import { routes } from "@/config/routes";
import { ColorIdentity } from "@/features/cards/components/color-identity";
import { formatRelativeDate } from "@/lib/utils/format-date";
import { DECK_FORMAT_LABELS, DECK_VISIBILITY_LABELS } from "../constants/deck-formats";
import type { LibraryFilters } from "../lib/library-filters";
import type { DeckFolder, DeckSummary } from "../types/deck";
import { DeckActions } from "./deck-actions";
import { DeckTags } from "./deck-tags";

interface DeckListTableProps {
  decks: DeckSummary[];
  folders: DeckFolder[];
  knownTags: string[];
  filters: LibraryFilters;
}

const CELL = "px-4 py-2";

/**
 * Vista de lista de la biblioteca: una tabla de verdad, para que los lectores de pantalla
 * anuncien cada dato con su columna. Es un Server Component: las fechas relativas se calculan
 * una sola vez en el servidor y no hay desajustes al hidratar.
 */
export function DeckListTable({ decks, folders, knownTags, filters }: DeckListTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs text-muted">
          <tr>
            <th scope="col" className={`${CELL} font-medium`}>
              Nombre
            </th>
            <th scope="col" className={`${CELL} font-medium`}>
              Colores
            </th>
            <th scope="col" className={`${CELL} font-medium`}>
              Formato
            </th>
            <th scope="col" className={`${CELL} text-right font-medium`}>
              Cartas
            </th>
            <th scope="col" className={`${CELL} font-medium`}>
              Visibilidad
            </th>
            <th scope="col" className={`${CELL} font-medium`}>
              Modificado
            </th>
            <th scope="col" className={CELL}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {decks.map((deck) => (
            <tr key={deck.id} className="transition-colors duration-150 hover:bg-surface/60">
              <td className={CELL}>
                <Link
                  href={routes.deckEditor(deck.id)}
                  className="font-medium transition-colors duration-200 hover:text-accent"
                >
                  {deck.name}
                </Link>
                <DeckTags tags={deck.tags} filters={filters} className="mt-1" />
              </td>
              <td className={CELL}>
                <ColorIdentity colors={deck.colorIdentity} />
              </td>
              <td className={`${CELL} text-muted`}>{DECK_FORMAT_LABELS[deck.format]}</td>
              <td className={`${CELL} text-right text-muted tabular-nums`}>{deck.cardCount}</td>
              <td className={`${CELL} text-muted`}>{DECK_VISIBILITY_LABELS[deck.visibility]}</td>
              <td className={`${CELL} text-muted`}>
                <time dateTime={deck.updatedAt}>{formatRelativeDate(deck.updatedAt)}</time>
              </td>
              <td className="px-2 py-1">
                <div className="flex justify-end">
                  <DeckActions deck={deck} folders={folders} knownTags={knownTags} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
