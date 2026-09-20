import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { ColorIdentity } from "@/features/cards/components/color-identity";
import { formatRelativeDate } from "@/lib/utils/format-date";
import { DECK_FORMAT_LABELS, DECK_VISIBILITY_LABELS } from "../constants/deck-formats";
import type { Deck } from "../types/deck";
import { VISIBILITY_ICONS } from "./deck-card";
import { SaveDeckCopyButton } from "./save-deck-copy-button";

interface DeckViewHeaderProps {
  deck: Deck;
  /** Copias que se juegan (comandante + mazo), ya contadas en el servidor. */
  cardCount: number;
}

/**
 * Presentación del mazo: el arte de su carta principal de fondo, de quién es, de qué formato
 * y qué se puede hacer con él. Editarlo solo aparece si es tuyo; si no, copiarlo.
 */
export function DeckViewHeader({ deck, cardCount }: DeckViewHeaderProps) {
  const VisibilityIcon = VISIBILITY_ICONS[deck.visibility];

  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-surface">
      {deck.coverImageUrl && (
        <>
          {/* `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN. */}
          <Image
            src={deck.coverImageUrl}
            alt=""
            fill
            unoptimized
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* El arte es decoración: el degradado garantiza que el texto se lea encima. */}
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/50" />
        </>
      )}

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="min-w-0 space-y-2">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {deck.name}
            <ColorIdentity colors={deck.colorIdentity} className="shrink-0" />
          </h1>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <Link
              href={routes.profile(deck.ownerUsername)}
              className="transition-colors duration-200 hover:text-foreground"
            >
              @{deck.ownerUsername}
            </Link>
            <Dot />
            {DECK_FORMAT_LABELS[deck.format]}
            <Dot />
            {cardCount} {cardCount === 1 ? "carta" : "cartas"}
            <Dot />
            <span className="inline-flex items-center gap-1">
              <VisibilityIcon className="size-3.5" aria-hidden />
              {DECK_VISIBILITY_LABELS[deck.visibility]}
            </span>
            <Dot />
            <time dateTime={deck.updatedAt}>actualizado {formatRelativeDate(deck.updatedAt)}</time>
          </p>

          {deck.description && (
            <p className="max-w-prose text-sm text-pretty">{deck.description}</p>
          )}

          {deck.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {deck.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {deck.viewerCanEdit ? (
            <Link href={routes.deckEditor(deck.id)} className={buttonStyles()}>
              <Pencil className="size-4" aria-hidden />
              Editar
            </Link>
          ) : (
            <SaveDeckCopyButton deckId={deck.id} />
          )}
        </div>
      </div>
    </header>
  );
}

/** Separador de los datos del mazo, invisible para los lectores de pantalla. */
function Dot() {
  return <span aria-hidden>·</span>;
}
