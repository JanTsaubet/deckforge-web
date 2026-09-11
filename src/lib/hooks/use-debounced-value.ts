"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve `value` solo después de `delay` milisegundos sin cambios.
 * Evita lanzar una petición por cada pulsación de teclado.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
