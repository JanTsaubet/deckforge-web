"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";
import { ManaCost } from "@/features/cards/components/mana-cost";
import type { DeckCardLine } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { entryKey } from "../lib/editor-entries";
import { useDeckEditor } from "../store/deck-editor-context";
import { DeckEntryActions } from "./deck-entry-actions";

interface DeckListRowProps {
  entry: DeckCardLine;
  /** El formato tiene comandante: se ofrece "Hacer comandante" en las cartas que pueden serlo. */
  hasCommander: boolean;
  /** Resaltada porque tiene un problema de legalidad. */
  flagged: boolean;
  /** Etiquetas usadas en el mazo, para sugerirlas al etiquetar esta carta. */
  deckTags: string[];
  /**
   * Identificador para arrastrarla. Agrupando por etiqueta, una carta con dos sale dos veces
   * y cada fila necesita el suyo; por defecto, el de la carta en su zona.
   */
  dragId?: string;
}

/**
 * Una línea del mazo: cantidad, nombre, coste y acciones. Las acciones aparecen al pasar el
 * ratón o al llegar con el teclado; en pantallas táctiles están siempre a la vista.
 *
 * La cantidad y el nombre son el asa para arrastrar la carta a otra zona. Los botones quedan
 * fuera de esa zona para que pulsarlos no sea nunca el principio de un arrastre.
 */
export function DeckListRow({ entry, hasCommander, flagged, deckTags, dragId }: DeckListRowProps) {
  const { card, board, quantity } = entry;
  const setPreviewCard = useDeckEditor((state) => state.setPreviewCard);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId ?? entryKey(board, card.id),
    data: { card, board, quantity },
  });

  // Con ratón, las acciones flotan sobre el final de la fila al pasar por encima (sin reservar
  // hueco: así el nombre usa todo el ancho). En pantallas táctiles van en la fila, visibles.
  const reveal = cn(
    "transition-opacity duration-150",
    "can-hover:pointer-events-none can-hover:absolute can-hover:top-1/2 can-hover:right-1 can-hover:-translate-y-1/2 can-hover:bg-surface-raised can-hover:px-0.5 can-hover:opacity-0 can-hover:shadow-md",
    "can-hover:group-hover:pointer-events-auto can-hover:group-hover:opacity-100",
    "can-hover:group-focus-within:pointer-events-auto can-hover:group-focus-within:opacity-100",
  );

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onMouseEnter={() => setPreviewCard(card)}
      onFocus={() => setPreviewCard(card)}
      className={cn(
        "group relative flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150 hover:bg-surface-raised/60",
        flagged && "bg-danger/10 hover:bg-danger/15",
        // Mientras viaja con el cursor, su sitio en la lista se queda atenuado.
        isDragging && "opacity-40",
      )}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        aria-roledescription="carta del mazo"
        title={card.typeLine}
        className="flex min-w-0 flex-1 cursor-grab items-center gap-2 rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-accent active:cursor-grabbing"
      >
        <span className="w-6 shrink-0 text-right text-muted tabular-nums">{quantity}</span>
        <span className={cn("min-w-0 flex-1 truncate", flagged && "text-danger")}>{card.name}</span>
      </div>

      <DeckEntryActions
        entry={entry}
        hasCommander={hasCommander}
        deckTags={deckTags}
        className={reveal}
      />

      {card.manaCost && <ManaCost cost={card.manaCost} className="shrink-0 [&_img]:size-4" />}
    </motion.li>
  );
}
