"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  show: (tone: ToastTone, message: string) => void;
  dismiss: (id: number) => void;
}

/** Tiempo que un aviso permanece visible antes de irse solo. */
export const TOAST_DURATION_MS = 4000;

let nextId = 0;

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  show: (tone, message) => {
    nextId += 1;
    const id = nextId;
    set((state) => ({ toasts: [...state.toasts, { id, tone, message }] }));
    window.setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Avisos breves ("Mazo borrado", "No se ha podido copiar") desde cualquier componente de cliente. */
export const toast = {
  success: (message: string) => useToastStore.getState().show("success", message),
  error: (message: string) => useToastStore.getState().show("error", message),
};

/** Pila de avisos en la esquina inferior derecha. Se monta una sola vez, en los providers. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            role={item.tone === "error" ? "alert" : undefined}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface-raised p-3 text-sm shadow-xl"
          >
            {item.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mana-g" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            )}
            <p className="flex-1">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Cerrar aviso"
              className="rounded p-0.5 text-muted transition-colors duration-200 hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
