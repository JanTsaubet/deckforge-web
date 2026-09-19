"use client";

import { Copy, FolderInput, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { deleteDeckAction, duplicateDeckAction } from "../actions/deck-actions";
import type { DeckFolder, DeckSummary } from "../types/deck";
import { OrganizeDeckDialog } from "./organize-deck-dialog";

interface DeckActionsProps {
  deck: Pick<DeckSummary, "id" | "name" | "folderId" | "tags">;
  folders: DeckFolder[];
  knownTags: string[];
  /**
   * En la tarjeta, las acciones solo aparecen al pasar el ratón (o al llegar con el teclado).
   * En pantallas táctiles, donde no hay "pasar por encima", están siempre visibles.
   */
  revealOnHover?: boolean;
}

const ACTION_BUTTON =
  "grid size-8 place-items-center rounded-lg bg-background/80 text-muted backdrop-blur transition-[opacity,color] duration-200 disabled:opacity-50";

const HOVER_REVEAL =
  "group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0";

/** Organizar, duplicar y borrar un mazo. Compartido por la tarjeta y por la vista de lista. */
export function DeckActions({ deck, folders, knownTags, revealOnHover = false }: DeckActionsProps) {
  const [isDuplicating, startDuplicate] = useTransition();
  const reveal = revealOnHover && HOVER_REVEAL;

  function duplicate() {
    startDuplicate(async () => {
      const result = await duplicateDeckAction(deck.id);
      if (result.ok) toast.success(`Copia creada: «${result.copyName}».`);
      else toast.error(result.error ?? "No se ha podido copiar el mazo.");
    });
  }

  async function remove(): Promise<string | void> {
    const result = await deleteDeckAction(deck.id);
    if (!result.ok) return result.error;
    toast.success(`«${deck.name}» se ha borrado.`);
  }

  return (
    <div className="flex gap-1">
      <OrganizeDeckDialog
        deck={deck}
        folders={folders}
        knownTags={knownTags}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            aria-label={`Organizar el mazo ${deck.name}`}
            title="Carpeta y etiquetas"
            className={cn(ACTION_BUTTON, reveal, "hover:text-foreground")}
          >
            <FolderInput className="size-4" aria-hidden />
          </button>
        )}
      />

      <button
        type="button"
        onClick={duplicate}
        disabled={isDuplicating}
        aria-label={`Duplicar el mazo ${deck.name}`}
        title="Duplicar"
        className={cn(ACTION_BUTTON, reveal, "hover:text-foreground")}
      >
        <Copy className="size-4" aria-hidden />
      </button>

      <ConfirmDialog
        title="¿Borrar este mazo?"
        description={
          <>Vas a borrar «{deck.name}» con todas sus cartas. Esta acción no se puede deshacer.</>
        }
        confirmLabel="Borrar"
        destructive
        onConfirm={remove}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            aria-label={`Borrar el mazo ${deck.name}`}
            title="Borrar"
            className={cn(ACTION_BUTTON, reveal, "hover:text-danger")}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      />
    </div>
  );
}
