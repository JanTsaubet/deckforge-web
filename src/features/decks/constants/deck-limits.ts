/**
 * Límites de la API de mazos, repetidos aquí para validar en el formulario antes de enviar.
 * La API es quien manda: si cambian allí, sus respuestas 400 lo dirán.
 */
export const MAX_DECK_NAME_LENGTH = 100;
export const MAX_FOLDER_NAME_LENGTH = 50;
export const MAX_DECK_TAGS = 10;
export const MAX_TAG_LENGTH = 30;
/** Etiquetas de cada carta dentro de un mazo ("rampa", "robo"…). */
export const MAX_ENTRY_TAGS = 10;
export const MAX_DECK_ENTRIES = 500;
export const MAX_ENTRY_QUANTITY = 999;

/** Tamaño máximo del texto de una lista a importar (unas 30 veces un mazo de Commander). */
export const MAX_DECKLIST_LENGTH = 30_000;

/** Misma normalización que la API: sin espacios de más, en minúsculas. */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLowerCase();
}
