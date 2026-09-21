"use client";

import { Tag, X } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MODAL_CLASSES } from "@/components/ui/modal-styles";
import { TagInput } from "@/components/ui/tag-input";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import { SUGGESTED_CARD_TAGS } from "@/features/decks/constants/card-tags";
import {
  MAX_ENTRY_TAGS,
  MAX_TAG_LENGTH,
  normalizeTag,
} from "@/features/decks/constants/deck-limits";
import type { DeckCardLine } from "@/features/decks/types/deck";
import { useDeckEditor } from "../store/deck-editor-context";

interface CardTagsDialogProps {
  entry: DeckCardLine;
  /** Etiquetas que ya se usan en este mazo: las primeras que se ofrecen, para no duplicarlas. */
  deckTags: string[];
  trigger: (open: () => void) => ReactNode;
}

/**
 * Etiquetas de una carta en este mazo ("rampa", "robo"…), para agruparlo por función. Es un
 * cambio más del editor: se ve al instante, se guarda solo y se puede deshacer.
 */
export function CardTagsDialog({ entry, deckTags, trigger }: CardTagsDialogProps) {
  const dialog = useModalDialog();
  const titleId = useId();
  const setTags = useDeckEditor((state) => state.setTags);
  const [tags, setDraft] = useState(entry.tags);

  // Cada vez que se abre, parte de lo que tiene la carta: descarta lo que se dejó a medias.
  function open() {
    setDraft(entry.tags);
    dialog.open();
  }

  function save(event: FormEvent) {
    event.preventDefault();
    setTags(entry.card, entry.board, tags);
    dialog.close();
  }

  const suggestions = [...new Set([...deckTags, ...SUGGESTED_CARD_TAGS])];

  return (
    <>
      {trigger(open)}
      <dialog {...dialog.dialogProps} aria-labelledby={titleId} className={MODAL_CLASSES}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <header className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-lg font-semibold">
              <Tag className="size-5 shrink-0 text-accent" aria-hidden />
              <span className="truncate">{entry.card.name}</span>
            </h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={dialog.close}
              className="rounded p-1 text-muted transition-colors duration-200 hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <TagInput
            label="Etiquetas de la carta"
            value={tags}
            onChange={setDraft}
            suggestions={suggestions}
            maxTags={MAX_ENTRY_TAGS}
            maxLength={MAX_TAG_LENGTH}
            normalize={normalizeTag}
          />
          <p className="-mt-2 text-xs text-muted">
            Sirven para agrupar el mazo por función: elige «Etiqueta» en «Agrupar por».
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={dialog.close}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
