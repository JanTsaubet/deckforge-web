import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import { DECK_FORMAT_LABELS } from "../constants/deck-formats";
import type { DeckSummary } from "../types/deck";

/** Tarjeta de mazo para rejillas. La portada hace un zoom suave al pasar el ratón. */
export function DeckCard({ deck }: { deck: DeckSummary }) {
  return (
    <Link
      href={routes.deck(deck.id)}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-[border-color,translate] duration-300 ease-smooth hover:-translate-y-0.5 hover:border-accent/50"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-raised">
        {deck.coverImageUrl && (
          // `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN.
          <Image
            src={deck.coverImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
          />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="truncate font-semibold">{deck.name}</h3>
        <p className="text-xs text-muted">
          {DECK_FORMAT_LABELS[deck.format]} · {deck.cardCount} cartas
        </p>
      </div>
    </Link>
  );
}
