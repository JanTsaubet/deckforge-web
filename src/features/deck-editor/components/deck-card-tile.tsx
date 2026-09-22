"use client";

import { useDraggable } from "@dnd-kit/core";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { DeckCardLine } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { entryKey } from "../lib/editor-entries";
import { useDeckEditor } from "../store/deck-editor-context";
import { DeckEntryActions } from "./deck-entry-actions";

interface DeckCardTileProps {
  entry: DeckCardLine;
  hasCommander: boolean;
  /** Resaltada porque tiene un problema de legalidad. */
  flagged: boolean;
  deckTags: string[];
  /** Identificador para arrastrarla; hace falta cuando una carta sale en varios grupos. */
  dragId?: string;
  /** En las pilas solo se ve la parte de arriba: el nombre tiene que caber ahí. */
  stacked?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Una carta del mazo como imagen. Toda la carta es el asa para arrastrarla; las acciones
 * aparecen encima al pasar el ratón (o al llegar con el teclado), sin tapar el nombre.
 */
export function DeckCardTile({
  entry,
  hasCommander,
  flagged,
  deckTags,
  dragId,
  stacked = false,
  className,
  style,
}: DeckCardTileProps) {
  const { card, board, quantity } = entry;
  const setPreviewCard = useDeckEditor((state) => state.setPreviewCard);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId ?? entryKey(board, card.id),
    data: { card, board, quantity },
  });

  return (
    <div
      style={style}
      onMouseEnter={() => setPreviewCard(card)}
      onFocus={() => setPreviewCard(card)}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-surface-raised ring-offset-2 ring-offset-background transition-shadow duration-200",
        flagged && "ring-2 ring-danger",
        isDragging && "opacity-40",
        className,
      )}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-roledescription="carta del mazo"
        title={`${quantity} × ${card.name}`}
        className="block w-full cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
      >
        {card.imageNormal ? (
          // `unoptimized`: las imágenes de Scryfall ya vienen optimizadas desde su CDN.
          <Image
            src={card.imageNormal}
            alt={card.name}
            width={488}
            height={680}
            unoptimized
            sizes="200px"
            className="aspect-[488/680] w-full object-cover"
          />
        ) : (
          <span className="grid aspect-[488/680] place-items-center p-3 text-center text-xs text-muted">
            {card.name}
          </span>
        )}
      </div>

      {quantity > 1 && (
        <span
          aria-label={`${quantity} copias`}
          className="pointer-events-none absolute top-1.5 right-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-medium tabular-nums backdrop-blur"
        >
          ×{quantity}
        </span>
      )}

      {/* En las pilas, las acciones van arriba, que es la única parte que se ve de la carta. */}
      <DeckEntryActions
        entry={entry}
        hasCommander={hasCommander}
        deckTags={deckTags}
        className={cn(
          "absolute right-1 left-1 justify-center bg-background/85 py-0.5 backdrop-blur transition-opacity duration-150",
          stacked ? "top-8" : "bottom-1.5",
          "can-hover:pointer-events-none can-hover:opacity-0",
          "can-hover:group-hover:pointer-events-auto can-hover:group-hover:opacity-100",
          "can-hover:group-focus-within:pointer-events-auto can-hover:group-focus-within:opacity-100",
        )}
      />
    </div>
  );
}
