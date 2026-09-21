"use client";

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
/** Último valor leído de cada clave, para devolver siempre el mismo objeto si no cambia. */
const snapshots = new Map<string, { raw: string | null; value: unknown }>();
/** Copia en memoria: si el navegador no deja guardar (modo privado), la preferencia dura la visita. */
const memory = new Map<string, string>();
let storageBroken = false;

function readRaw(key: string): string | null {
  if (storageBroken) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    storageBroken = true;
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: string, raw: string) {
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    storageBroken = true;
  }
  for (const listener of listeners.get(key) ?? []) listener();
}

/**
 * Una preferencia de quien usa la página (cómo agrupar, el ancho de una columna…) guardada
 * en su navegador. Nada que tenga que llegar a otros dispositivos ni a otras personas: para
 * eso está la API.
 *
 * Se lee con `useSyncExternalStore`: el servidor y el primer render usan `fallback` (así la
 * hidratación coincide) y justo después se aplica lo guardado. Lo que haya en el
 * almacenamiento se valida con `isValid`, porque puede ser de una versión anterior o haberlo
 * tocado cualquiera. Si cambia en otra pestaña, esta también se entera.
 */
export function useLocalPreference<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const subscribe = useCallback(
    (listener: Listener) => {
      const own = listeners.get(key) ?? new Set<Listener>();
      own.add(listener);
      listeners.set(key, own);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        own.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const getSnapshot = () => {
    const raw = readRaw(key);
    const cached = snapshots.get(key);
    if (cached && cached.raw === raw) return cached.value as T;

    const value = raw === null ? fallback : parse(raw, isValid, fallback);
    snapshots.set(key, { raw, value });
    return value;
  };

  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);
  const setValue = useCallback((next: T) => writeRaw(key, JSON.stringify(next)), [key]);
  return [value, setValue];
}

function parse<T>(raw: string, isValid: (value: unknown) => value is T, fallback: T): T {
  try {
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
