import { Globe, Layers, Link2, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { ColorIdentity } from "@/features/cards/components/color-identity";
import { DECK_FORMAT_LABELS, DECK_VISIBILITY_LABELS } from "../constants/deck-formats";
import type { LibraryFilters } from "../lib/library-filters";
import type { DeckFolder, DeckSummary, DeckVisibility } from "../types/deck";
import { DeckActions } from "./deck-actions";
import { DeckTags } from "./deck-tags";

export const VISIBILITY_ICONS: Record<DeckVisibility, typeof Lock> = {
  private: Lock,
  unlisted: Link2,
  public: Globe,
};

interface DeckCardProps {
  deck: DeckSummary;
  folders: DeckFolder[];
  knownTags: string[];
  filters: LibraryFilters;
}

/**
 * Tarjeta de mazo para la rejilla.
 *
 * Toda la tarjeta es clicable, pero el enlace es solo el título: su `::after` se estira sobre
 * la tarjeta entera. Así las etiquetas y las acciones pueden ser enlaces y botones propios
 * encima (un elemento interactivo dentro de otro no es HTML válido).
 */
export function DeckCard({ deck, folders, knownTags, filters }: DeckCardProps) {
  const VisibilityIcon = VISIBILITY_ICONS[deck.visibility];

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-[translate,border-color] duration-300 ease-smooth hover:-translate-y-0.5 hover:border-accent/50 has-[a:focus-visible]:border-accent">
      <div className="relative grid aspect-video place-items-center overflow-hidden bg-surface-raised">
        {deck.coverImageUrl ? (
          // `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN.
          <Image
            src={deck.coverImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
          />
        ) : (
          <Layers className="size-10 text-muted/30" aria-hidden />
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">
              <Link
                // La biblioteca es tuya: abrir un mazo es abrir su editor.
                href={routes.deckEditor(deck.id)}
                className="outline-none after:absolute after:inset-0 after:content-['']"
              >
                {deck.name}
              </Link>
            </h3>
            <ColorIdentity colors={deck.colorIdentity} className="shrink-0" />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <VisibilityIcon
              className="size-3.5"
              aria-label={DECK_VISIBILITY_LABELS[deck.visibility]}
            />
            {DECK_FORMAT_LABELS[deck.format]} · {deck.cardCount}{" "}
            {deck.cardCount === 1 ? "carta" : "cartas"}
          </p>
        </div>
        <DeckTags tags={deck.tags} filters={filters} className="relative" />
      </div>

      <div className="absolute top-2 right-2">
        <DeckActions deck={deck} folders={folders} knownTags={knownTags} revealOnHover />
      </div>
    </article>
  );
}
