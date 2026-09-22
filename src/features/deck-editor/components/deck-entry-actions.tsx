"use client";

import { Crown, Minus, Plus, Tag } from "lucide-react";
import { DECK_BOARD_LABELS, DECK_BOARDS } from "@/features/decks/constants/deck-formats";
import { canBeCommander } from "@/features/decks/lib/deck-validation";
import type { DeckBoard, DeckCardLine } from "@/features/decks/types/deck";
import { cn } from "@/lib/utils/cn";
import { useDeckEditor } from "../store/deck-editor-context";
import { CardTagsDialog } from "./card-tags-dialog";

interface DeckEntryActionsProps {
  entry: DeckCardLine;
  /** El formato tiene comandante: se ofrece la corona en las cartas que pueden serlo. */
  hasCommander: boolean;
  /** Etiquetas usadas en el mazo, para sugerirlas al etiquetar esta carta. */
  deckTags: string[];
  className?: string;
}

const ICON_BUTTON =
  "grid size-6 place-items-center rounded text-muted transition-colors duration-150 hover:bg-surface-raised hover:text-foreground disabled:opacity-40";

/**
 * Lo que se puede hacer con una carta del mazo: quitar y poner copias, hacerla comandante,
 * etiquetarla y moverla de zona. Es el mismo grupo de botones en la lista y en las vistas de
 * imágenes y pilas, para que nada cambie de sitio al cambiar de vista.
 */
export function DeckEntryActions({
  entry,
  hasCommander,
  deckTags,
  className,
}: DeckEntryActionsProps) {
  const { card, board, quantity, tags } = entry;
  const addCopies = useDeckEditor((state) => state.addCopies);
  const moveCard = useDeckEditor((state) => state.moveCard);

  // Al hueco de comandante solo se ofrece mover lo que puede serlo.
  const destinations = DECK_BOARDS.filter(
    (target) =>
      target !== board && (target !== "commander" || (hasCommander && canBeCommander(card))),
  );

  return (
    <div className={cn("flex items-center gap-0.5 rounded-md", className)}>
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
      <CardTagsDialog
        entry={entry}
        deckTags={deckTags}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            aria-label={`Etiquetas de ${card.name}${tags.length > 0 ? `: ${tags.join(", ")}` : ""}`}
            title={tags.length > 0 ? `Etiquetas: ${tags.join(", ")}` : "Etiquetar"}
            className={cn(ICON_BUTTON, tags.length > 0 && "text-accent")}
          >
            <Tag className="size-3.5" aria-hidden />
          </button>
        )}
      />
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
  );
}
