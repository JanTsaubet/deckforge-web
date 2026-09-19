"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Estado de un diálogo modal sobre <dialog>.
 *
 * Si está abierto o no es estado de React; un efecto lo traslada al <dialog> nativo con
 * `showModal()` y `close()`. Así se puede pintar el botón que lo abre durante el render sin
 * tocar la ref, y el navegador sigue haciéndose cargo del foco, de Escape y del fondo inerte.
 *
 * Hay que pasar `dialogProps` al <dialog>: su `onClose` avisa al estado cuando el navegador
 * lo cierra por su cuenta (con Escape).
 */
export function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close, dialogProps: { ref, onClose: close } };
}
