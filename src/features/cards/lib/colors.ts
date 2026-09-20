import type { ManaColor } from "../types/card";

/** Los cinco colores en su orden canónico (WUBRG). */
export const MANA_COLOR_ORDER: readonly ManaColor[] = ["W", "U", "B", "R", "G"];

/** Sin repetidos y en orden WUBRG, que es como se leen y se muestran. */
export function sortColors(colors: ManaColor[]): ManaColor[] {
  return [...new Set(colors)].sort(
    (a, b) => MANA_COLOR_ORDER.indexOf(a) - MANA_COLOR_ORDER.indexOf(b),
  );
}
