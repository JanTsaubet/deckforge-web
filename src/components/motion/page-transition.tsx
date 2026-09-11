"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Animación de entrada de cada página. Se monta desde `template.tsx`, que Next.js
 * vuelve a instanciar en cada navegación, así que la animación se repite al cambiar de ruta.
 *
 * El App Router no admite de forma estable animaciones de salida con AnimatePresence;
 * las transiciones completas entre rutas se evaluarán con la View Transitions API (ver README).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
