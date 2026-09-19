"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { Button } from "./button";
import { FormError } from "./form-field";
import { MODAL_CLASSES } from "./modal-styles";
import { useModalDialog } from "./use-modal-dialog";

interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Acción destructiva: el botón de confirmar se pinta en rojo. */
  destructive?: boolean;
  /**
   * Lo que se confirma. Si devuelve un mensaje, se muestra dentro del diálogo sin cerrarlo
   * (para poder reintentar); si no devuelve nada, el diálogo se cierra.
   */
  onConfirm: () => Promise<string | void>;
  /** Pinta el elemento que abre el diálogo; recibe la función para abrirlo. */
  trigger: (open: () => void) => ReactNode;
}

/**
 * Confirmación con el estilo de la app, sobre <dialog>. Al abrirse, el foco va a "Cancelar":
 * en una acción destructiva, lo seguro debe ser lo que ocurre si se pulsa Enter sin pensar.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const dialog = useModalDialog();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const titleId = useId();

  const open = () => {
    setError(undefined);
    dialog.open();
  };

  function confirm() {
    startTransition(async () => {
      const failure = await onConfirm();
      if (failure) {
        setError(failure);
        return;
      }
      dialog.close();
    });
  }

  return (
    <>
      {trigger(open)}
      <dialog {...dialog.dialogProps} aria-labelledby={titleId} className={MODAL_CLASSES}>
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <div className="text-sm text-pretty text-muted">{description}</div>
          {error && <FormError>{error}</FormError>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={dialog.close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant={destructive ? "danger" : "primary"}
              onClick={confirm}
              disabled={isPending}
            >
              {isPending ? "Un momento…" : confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
