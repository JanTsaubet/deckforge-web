/**
 * Cálculos de la rejilla de cartas, aparte del componente para poder probarlos.
 * Los cortes por ancho reproducen los que tenía la rejilla en CSS.
 */

/** Proporción real de una carta de Magic (ancho / alto). */
export const CARD_ASPECT_RATIO = 5 / 7;

/** Separación entre cartas en píxeles; equivale al `gap-4` de Tailwind. */
export const GRID_GAP = 16;

/** Columnas que caben en el ancho disponible. */
export function columnsForWidth(width: number): number {
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

/** Alto de una fila: el alto de la carta más la separación inferior. */
export function rowHeightForWidth(width: number, columns: number): number {
  const cardWidth = (width - GRID_GAP * (columns - 1)) / columns;
  return cardWidth / CARD_ASPECT_RATIO + GRID_GAP;
}
