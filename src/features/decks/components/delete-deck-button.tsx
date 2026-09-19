"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteDeckAction } from "../actions/deck-actions";

interface DeleteDeckButtonProps {
  deckId: string;
  deckName: string;
}

/**
 * Borra un mazo tras confirmarlo. En pantallas con ratón solo aparece al pasar por encima de
 * la tarjeta (o al llegar con el teclado); en pantallas táctiles, donde no hay "pasar por
 * encima", está siempre visible.
 */
export function DeleteDeckButton({ deckId, deckName }: DeleteDeckButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    // TODO(Fase 2): sustituir confirm/alert por un diálogo propio con el estilo de la app.
    if (!window.confirm(`¿Borrar «${deckName}»? Esta acción no se puede deshacer.`)) return;

    startTransition(async () => {
      const result = await deleteDeckAction(deckId);
      if (!result.ok) window.alert(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Borrar el mazo ${deckName}`}
      title="Borrar mazo"
      className="grid size-8 place-items-center rounded-lg bg-background/80 text-muted backdrop-blur transition-[opacity,color] duration-200 group-hover:opacity-100 hover:text-danger focus-visible:opacity-100 disabled:opacity-50 [@media(hover:hover)]:opacity-0"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}
