import type { EntryChange } from "@/features/decks/services/deck-repository";
import type { CatalogCard, DeckBoard, DeckCardLine } from "@/features/decks/types/deck";

/** Máximo de copias de una carta que admite la API. */
export const MAX_COPIES = 999;

/** Identifica una línea: la misma carta puede estar en dos zonas a la vez. */
export function entryKey(board: DeckBoard, cardId: string): string {
  return `${board}:${cardId}`;
}

/**
 * Fija la cantidad de una carta en una zona: 0 la quita. Si la carta no estaba, entra con
 * `tags` (sin etiquetas si no se dicen); si ya estaba, conserva las suyas. No modifica la
 * lista recibida.
 */
export function setQuantity(
  entries: DeckCardLine[],
  card: CatalogCard,
  board: DeckBoard,
  quantity: number,
  tags: string[] = [],
): DeckCardLine[] {
  const clamped = Math.max(0, Math.min(MAX_COPIES, Math.trunc(quantity)));
  const index = indexOf(entries, card.id, board);

  if (index === -1)
    return clamped === 0 ? entries : [...entries, { card, board, quantity: clamped, tags }];
  if (clamped === 0) return entries.filter((_, position) => position !== index);
  return entries.map((entry, position) =>
    position === index ? { ...entry, quantity: clamped } : entry,
  );
}

/** Suma (o resta, con `delta` negativo) copias de una carta en una zona. */
export function addCopies(
  entries: DeckCardLine[],
  card: CatalogCard,
  board: DeckBoard,
  delta: number,
): DeckCardLine[] {
  return setQuantity(entries, card, board, quantityOf(entries, card.id, board) + delta);
}

/**
 * Mueve todas las copias de una carta de una zona a otra (si ya había copias en el destino,
 * se suman). En el hueco de comandante no caben copias: se mueve una y el resto se queda.
 *
 * Las etiquetas viajan con la carta: una "rampa" que baja al banquillo sigue siendo rampa.
 * Si en el destino ya tenía otras, se quedan las de las dos.
 */
export function moveCard(
  entries: DeckCardLine[],
  card: CatalogCard,
  from: DeckBoard,
  to: DeckBoard,
): DeckCardLine[] {
  if (from === to) return entries;
  const available = quantityOf(entries, card.id, from);
  if (available === 0) return entries;

  const moved = to === "commander" ? 1 : available;
  const tags = mergeTags(tagsOf(entries, card.id, to), tagsOf(entries, card.id, from));
  const withoutSource = setQuantity(entries, card, from, available - moved);
  const withTarget = setQuantity(
    withoutSource,
    card,
    to,
    quantityOf(entries, card.id, to) + moved,
    tags,
  );
  return setTags(withTarget, card, to, tags);
}

/**
 * Cambia las etiquetas de una carta en una zona. Solo de una carta que ya está: etiquetar
 * no la añade. Si no cambia nada, devuelve la misma lista (y no se apunta en el historial).
 */
export function setTags(
  entries: DeckCardLine[],
  card: CatalogCard,
  board: DeckBoard,
  tags: string[],
): DeckCardLine[] {
  const index = indexOf(entries, card.id, board);
  const current = entries[index];
  if (!current || sameTags(current.tags, tags)) return entries;
  return entries.map((entry, position) => (position === index ? { ...entry, tags } : entry));
}

export function quantityOf(entries: DeckCardLine[], cardId: string, board: DeckBoard): number {
  return entries[indexOf(entries, cardId, board)]?.quantity ?? 0;
}

function tagsOf(entries: DeckCardLine[], cardId: string, board: DeckBoard): string[] {
  return entries[indexOf(entries, cardId, board)]?.tags ?? [];
}

function indexOf(entries: DeckCardLine[], cardId: string, board: DeckBoard): number {
  return entries.findIndex((entry) => entry.card.id === cardId && entry.board === board);
}

/** Las de las dos listas, sin repetir y en el orden en que aparecen. */
function mergeTags(first: string[], second: string[]): string[] {
  return [...new Set([...first, ...second])];
}

/** Mismas etiquetas en el mismo orden: el orden es el que eligió su dueño al escribirlas. */
export function sameTags(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((tag, index) => tag === b[index]);
}

/**
 * Qué hay que decirle a la API para pasar de `before` a `after`: el estado final de cada
 * línea que ha cambiado (0 si ha desaparecido). Sirve igual para una edición que para un
 * deshacer, que no es más que volver a un estado anterior.
 *
 * Cada cambio lleva el estado completo de su línea, etiquetas incluidas, aunque solo haya
 * cambiado la cantidad: así, si la misma carta cambia varias veces antes de guardarse, el
 * último cambio basta por sí solo y no se pierde nada al quedarse solo con él.
 */
export function diffEntries(before: DeckCardLine[], after: DeckCardLine[]): EntryChange[] {
  const previous = new Map(before.map((entry) => [entryKey(entry.board, entry.card.id), entry]));
  const changes: EntryChange[] = [];

  for (const entry of after) {
    const key = entryKey(entry.board, entry.card.id);
    const old = previous.get(key);
    if (old?.quantity !== entry.quantity || !sameTags(old.tags, entry.tags)) {
      changes.push({
        cardId: entry.card.id,
        board: entry.board,
        quantity: entry.quantity,
        tags: entry.tags,
      });
    }
    previous.delete(key);
  }
  for (const gone of previous.values()) {
    changes.push({ cardId: gone.card.id, board: gone.board, quantity: 0 });
  }
  return changes;
}

/** ¿Dicen lo mismo dos cambios? Para saber si lo guardado sigue siendo lo último. */
export function sameChange(a: EntryChange, b: EntryChange): boolean {
  return a.quantity === b.quantity && sameTags(a.tags ?? [], b.tags ?? []);
}
