"use client";

import { Crown, Minus, Plus } from "lucide-react";
import { motion } from "motion/react";
import { ManaCost } from "@/features/cards/components/mana-cost";
import { DECK_BOARD_LABELS, DECK_BOARDS } from "@/features/decks/constants/deck-formats";
import type { DeckBoard } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { canBeCommander } from "../lib/deck-validation";
import type { EditorEntry } from "../lib/editor-entries";
import { useDeckEditor } from "../store/deck-editor-context";

interface DeckListRowProps {
  entry: EditorEntry;
  /** El formato tiene comandante: se ofrece "Hacer comandante" en las cartas que pueden serlo. */
  hasCommander: boolean;
  /** Resaltada porque tiene un problema de legalidad. */
  flagged: boolean;
}

const ICON_BUTTON =
  "grid size-6 place-items-center rounded text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-foreground disabled:opacity-40";

/**
 * Una línea del mazo: cantidad, nombre, coste y acciones. Las acciones aparecen al pasar el
 * ratón o al llegar con el teclado; en pantallas táctiles están siempre a la vista.
 */
export function DeckListRow({ entry, hasCommander, flagged }: DeckListRowProps) {
  const { card, board, quantity } = entry;
  const addCopies = useDeckEditor((state) => state.addCopies);
  const moveCard = useDeckEditor((state) => state.moveCard);
  const setPreviewCard = useDeckEditor((state) => state.setPreviewCard);

  // Con ratón, las acciones flotan sobre el final de la fila al pasar por encima (sin reservar
  // hueco: así el nombre usa todo el ancho). En pantallas táctiles van en la fila, visibles.
  const reveal = cn(
    "flex items-center gap-0.5 rounded-md transition-opacity duration-150",
    "can-hover:pointer-events-none can-hover:absolute can-hover:top-1/2 can-hover:right-1 can-hover:-translate-y-1/2 can-hover:bg-surface-raised can-hover:px-0.5 can-hover:opacity-0 can-hover:shadow-md",
    "can-hover:group-hover:pointer-events-auto can-hover:group-hover:opacity-100",
    "can-hover:group-focus-within:pointer-events-auto can-hover:group-focus-within:opacity-100",
  );
  // Al hueco de comandante solo se ofrece mover lo que puede serlo.
  const destinations = DECK_BOARDS.filter(
    (target) =>
      target !== board && (target !== "commander" || (hasCommander && canBeCommander(card))),
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
      )}
    >
      <span className="w-6 text-right text-muted tabular-nums">{quantity}</span>
      <span
        className={cn("min-w-0 flex-1 truncate", flagged && "text-danger")}
        title={card.typeLine}
      >
        {card.name}
      </span>

      <div className={reveal}>
        {board !== "commander" && (
          <>
            <button
              type="button"
              onClick={() => addCopies(card, board, -1)}
              aria-label={`Quitar una copia de ${card.name}`}
              title="Quitar una"
              className={ICON_BUTTON}
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => addCopies(card, board, 1)}
              aria-label={`Añadir una copia de ${card.name}`}
              title="Añadir una"
              className={ICON_BUTTON}
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </>
        )}
        {hasCommander && board === "main" && canBeCommander(card) && (
          <button
            type="button"
            onClick={() => moveCard(card, "main", "commander")}
            aria-label={`Hacer comandante a ${card.name}`}
            title="Hacer comandante"
            className={ICON_BUTTON}
          >
            <Crown className="size-3.5" aria-hidden />
          </button>
        )}
        <select
          aria-label={`Mover ${card.name} a otra zona`}
          title="Mover a…"
          value=""
          onChange={(event) => {
            const target = event.target.value as DeckBoard | "remove";
            if (target === "remove") addCopies(card, board, -quantity);
            else moveCard(card, board, target);
          }}
          className="h-6 w-6 cursor-pointer appearance-none rounded bg-transparent text-center text-xs text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-foreground"
        >
          <option value="" disabled>
            ⋯
          </option>
          {destinations.map((target) => (
            <option key={target} value={target}>
              Mover a {DECK_BOARD_LABELS[target]}
            </option>
          ))}
          <option value="remove">Quitar del mazo</option>
        </select>
      </div>

      {card.manaCost && <ManaCost cost={card.manaCost} className="shrink-0 [&_img]:size-4" />}
    </motion.li>
  );
}
