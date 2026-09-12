"use client";

import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  /** Mientras sea `false` no se observa nada (no hay más páginas, o ya se están pidiendo). */
  enabled: boolean;
  /** Margen de anticipación: la carga empieza antes de que el centinela sea visible. */
  rootMargin?: string;
}

/**
 * Devuelve una `ref` para un elemento centinela al final de la lista: cuando se acerca
 * a la pantalla, dispara `onIntersect` para pedir la página siguiente.
 *
 * `onIntersect` debe ser estable (envuelto en `useCallback`); si cambia en cada render,
 * el observador se recrearía continuamente.
 */
export function useInfiniteScroll<T extends HTMLElement>(
  onIntersect: () => void,
  { enabled, rootMargin = "600px" }: UseInfiniteScrollOptions,
) {
  const sentinelRef = useRef<T>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, rootMargin, onIntersect]);

  return sentinelRef;
}
