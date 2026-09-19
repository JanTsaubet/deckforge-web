"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "./button";
import { FormError } from "./form-field";
import { MODAL_CLASSES } from "./modal-styles";

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
 *
 * Si está abierto o no es estado de React; un efecto lo traslada al <dialog> nativo. Así el
 * `trigger` se puede pintar durante el render sin tocar la ref del diálogo.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const open = () => {
    setError(undefined);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  function confirm() {
    startTransition(async () => {
      const failure = await onConfirm();
      if (failure) {
        setError(failure);
        return;
      }
      close();
    });
  }

  return (
    <>
      {trigger(open)}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // Escape cierra el <dialog> por su cuenta: el estado tiene que enterarse.
        onClose={close}
        className={MODAL_CLASSES}
      >
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <div className="text-sm text-pretty text-muted">{description}</div>
          {error && <FormError>{error}</FormError>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={close} disabled={isPending}>
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
