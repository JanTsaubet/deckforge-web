/** Lo que se escribe en el buscador del editor: "4 Lightning Bolt", "4x bolt" o "bolt". */
export interface QuickAdd {
  quantity: number;
  query: string;
}

/** Copias máximas de una sola vez: más que eso es casi seguro un error al teclear. */
const MAX_QUICK_QUANTITY = 99;

/**
 * Separa la cantidad del nombre, como en las listas de texto: "4 Lightning Bolt" añade
 * cuatro copias. Sin número, una.
 */
export function parseQuickAdd(text: string): QuickAdd {
  const match = /^\s*(\d+)\s*x?\s+(.*)$/i.exec(text);
  if (!match) return { quantity: 1, query: text.trim() };

  const quantity = Math.min(Math.max(Number(match[1]), 1), MAX_QUICK_QUANTITY);
  return { quantity, query: (match[2] ?? "").trim() };
}
