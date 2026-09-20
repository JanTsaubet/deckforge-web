import type { EntryChange } from "@/features/decks/services/deck-repository";
import type { CatalogCard, DeckBoard, DeckCardLine } from "@/features/decks/types/deck";

/** Máximo de copias de una carta que admite la API. */
export const MAX_COPIES = 999;

/** Identifica una línea: la misma carta puede estar en dos zonas a la vez. */
export function entryKey(board: DeckBoard, cardId: string): string {
  return `${board}:${cardId}`;
}

/** Fija la cantidad de una carta en una zona: 0 la quita. No modifica la lista recibida. */
export function setQuantity(
  entries: DeckCardLine[],
  card: CatalogCard,
  board: DeckBoard,
  quantity: number,
): DeckCardLine[] {
  const clamped = Math.max(0, Math.min(MAX_COPIES, Math.trunc(quantity)));
  const key = entryKey(board, card.id);
  const index = entries.findIndex((entry) => entryKey(entry.board, entry.card.id) === key);

  if (index === -1)
    return clamped === 0 ? entries : [...entries, { card, board, quantity: clamped }];
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
  const withoutSource = setQuantity(entries, card, from, available - moved);
  return setQuantity(withoutSource, card, to, quantityOf(entries, card.id, to) + moved);
}

export function quantityOf(entries: DeckCardLine[], cardId: string, board: DeckBoard): number {
  return entries.find((entry) => entry.card.id === cardId && entry.board === board)?.quantity ?? 0;
}

/**
 * Qué hay que decirle a la API para pasar de `before` a `after`: la cantidad final de cada
 * línea que ha cambiado (0 si ha desaparecido). Sirve igual para una edición que para un
 * deshacer, que no es más que volver a un estado anterior.
 */
export function diffEntries(before: DeckCardLine[], after: DeckCardLine[]): EntryChange[] {
  const previous = new Map(before.map((entry) => [entryKey(entry.board, entry.card.id), entry]));
  const changes: EntryChange[] = [];

  for (const entry of after) {
    const key = entryKey(entry.board, entry.card.id);
    if (previous.get(key)?.quantity !== entry.quantity) {
      changes.push({ cardId: entry.card.id, board: entry.board, quantity: entry.quantity });
    }
    previous.delete(key);
  }
  for (const gone of previous.values()) {
    changes.push({ cardId: gone.card.id, board: gone.board, quantity: 0 });
  }
  return changes;
}
