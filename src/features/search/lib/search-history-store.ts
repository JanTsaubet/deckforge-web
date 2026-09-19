/**
 * Historial de búsquedas guardado en este navegador (localStorage).
 *
 * Tiene la forma que pide `useSyncExternalStore` (subscribe + getSnapshot), que es la
 * manera correcta de leer un almacén externo en React: sin desajustes de hidratación
 * (en el servidor el historial está vacío) y sincronizado entre pestañas.
 */

const STORAGE_KEY = "deckforge:search-history";

/** Búsquedas recientes que se conservan. */
export const MAX_HISTORY_ENTRIES = 8;

const EMPTY: readonly string[] = [];

/** Última lectura, para devolver la misma referencia mientras no cambie el contenido. */
let cache: { raw: string | null; entries: readonly string[] } | null = null;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Almacenamiento bloqueado (modo privado estricto, políticas del navegador…).
    return null;
  }
}

function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    // Un valor corrupto no debe romper la barra de búsqueda: se trata como vacío.
    return EMPTY;
  }
}

/**
 * Devuelve siempre la misma referencia si el contenido no ha cambiado.
 * `useSyncExternalStore` compara por referencia: un array nuevo en cada llamada
 * provocaría renders infinitos.
 */
function getSnapshot(): readonly string[] {
  const raw = readRaw();
  if (cache?.raw !== raw) cache = { raw, entries: parse(raw) };
  return cache.entries;
}

function write(entries: readonly string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Sin almacenamiento, el historial simplemente no persiste.
  }
  listeners.forEach((listener) => listener());
}

export const searchHistoryStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);

    // El evento `storage` solo llega a las OTRAS pestañas: así se mantienen sincronizadas.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) listener();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },

  getSnapshot,

  /** En el servidor no hay historial. */
  getServerSnapshot: (): readonly string[] => EMPTY,

  /** Añade la búsqueda al principio; si ya estaba, la sube en vez de duplicarla. */
  add(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;

    const rest = getSnapshot().filter((entry) => entry !== trimmed);
    write([trimmed, ...rest].slice(0, MAX_HISTORY_ENTRIES));
  },

  remove(query: string) {
    write(getSnapshot().filter((entry) => entry !== query));
  },

  clear() {
    write([]);
  },
};
