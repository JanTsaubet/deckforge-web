"use client";

import { Copy, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { deleteDeckAction, duplicateDeckAction } from "../actions/deck-actions";

interface DeckActionsProps {
  deckId: string;
  deckName: string;
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

/** Duplicar y borrar un mazo. Compartido por la tarjeta y por la vista de lista. */
export function DeckActions({ deckId, deckName, revealOnHover = false }: DeckActionsProps) {
  const [isDuplicating, startDuplicate] = useTransition();
  const reveal = revealOnHover && HOVER_REVEAL;

  function duplicate() {
    startDuplicate(async () => {
      const result = await duplicateDeckAction(deckId);
      if (result.ok) toast.success(`Copia creada: «${result.copyName}».`);
      else toast.error(result.error ?? "No se ha podido copiar el mazo.");
    });
  }

  async function remove(): Promise<string | void> {
    const result = await deleteDeckAction(deckId);
    if (!result.ok) return result.error;
    toast.success(`«${deckName}» se ha borrado.`);
  }

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={duplicate}
        disabled={isDuplicating}
        aria-label={`Duplicar el mazo ${deckName}`}
        title="Duplicar"
        className={cn(ACTION_BUTTON, reveal, "hover:text-foreground")}
      >
        <Copy className="size-4" aria-hidden />
      </button>

      <ConfirmDialog
        title="¿Borrar este mazo?"
        description={
          <>Vas a borrar «{deckName}» con todas sus cartas. Esta acción no se puede deshacer.</>
        }
        confirmLabel="Borrar"
        destructive
        onConfirm={remove}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            aria-label={`Borrar el mazo ${deckName}`}
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
