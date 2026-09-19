import { Globe, Layers, Link2, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { DECK_FORMAT_LABELS, DECK_VISIBILITY_LABELS } from "../constants/deck-formats";
import type { DeckSummary, DeckVisibility } from "../types/deck";
import { DeleteDeckButton } from "./delete-deck-button";

const VISIBILITY_ICONS: Record<DeckVisibility, typeof Lock> = {
  private: Lock,
  unlisted: Link2,
  public: Globe,
};

/**
 * Tarjeta de mazo para rejillas. El botón de borrar va FUERA del enlace:
 * un elemento interactivo dentro de otro no es HTML válido.
 */
export function DeckCard({ deck }: { deck: DeckSummary }) {
  const VisibilityIcon = VISIBILITY_ICONS[deck.visibility];

  return (
    <div className="group relative transition-transform duration-300 ease-smooth hover:-translate-y-0.5">
      <Link
        href={routes.deck(deck.id)}
        className="block overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-300 group-hover:border-accent/50"
      >
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
        <div className="space-y-1 p-4">
          <h3 className="truncate font-semibold">{deck.name}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <VisibilityIcon
              className="size-3.5"
              aria-label={DECK_VISIBILITY_LABELS[deck.visibility]}
            />
            {DECK_FORMAT_LABELS[deck.format]} · {deck.cardCount}{" "}
            {deck.cardCount === 1 ? "carta" : "cartas"}
          </p>
        </div>
      </Link>

      <div className="absolute top-2 right-2">
        <DeleteDeckButton deckId={deck.id} deckName={deck.name} />
      </div>
    </div>
  );
}
