"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { MODAL_CLASSES } from "./modal-styles";
import type { ModalDialog } from "./use-modal-dialog";

interface ModalProps {
  /** Estado del diálogo, de `useModalDialog`. */
  dialog: ModalDialog;
  /** Título accesible: el id del encabezado, o `aria-label` si no hay encabezado visible. */
  "aria-labelledby"?: string;
  "aria-label"?: string;
  /** Estilos propios de este diálogo (ancho, relleno…) sobre los comunes. */
  className?: string;
  children: ReactNode;
}

/**
 * Un diálogo modal, montado al final del `<body>`.
 *
 * Que viva ahí y no donde está el botón que lo abre no es un detalle: un modal se abre desde
 * una fila o una tarjeta, pero no es parte de ellas, y si se pinta dentro hereda su estado.
 * Las acciones de una carta, por ejemplo, están ocultas (`pointer-events: none`) hasta que el
 * ratón pasa por la fila; al abrirse el diálogo el cursor sale de ella, y el diálogo se
 * quedaba sin poder recibir ni un clic, ni siquiera en su botón de cerrar.
 */
export function Modal({ dialog, className, children, ...labels }: ModalProps) {
  // En el servidor no hay `document`, así que el portal solo existe en el navegador: en el
  // servidor y en el primer pintado no hay nada (y no hay diferencia entre los dos, que es lo
  // que rompería la hidratación). Un modal siempre nace cerrado, no se pierde ninguna apertura.
  if (!useIsBrowser()) return null;

  return createPortal(
    <dialog {...dialog.dialogProps} {...labels} className={cn(MODAL_CLASSES, className)}>
      {children}
    </dialog>,
    document.body,
  );
}

/** Nunca cambia, pero React lo pide: este estado no viene de fuera, solo distingue el entorno. */
const noSubscription = () => () => {};

/** `false` en el servidor y en el primer pintado; `true` en cuanto el navegador se hace cargo. */
function useIsBrowser(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
