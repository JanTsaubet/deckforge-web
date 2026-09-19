/**
 * Símbolos de Magic ({G}, {T}, {W/U}, {2/W}…) y su SVG oficial en Scryfall.
 *
 * El nombre del fichero se obtiene quitando llaves y barras: {W/U} → WU.svg,
 * {2/W} → 2W.svg, {G/P} → GP.svg. Comprobado contra el endpoint /symbology.
 */

const SYMBOL_BASE_URL = "https://svgs.scryfall.io/card-symbols";

/** URL del SVG oficial de un símbolo. */
export function manaSymbolUrl(symbol: string): string {
  const code = symbol.replace(/[{}/]/g, "");
  return `${SYMBOL_BASE_URL}/${encodeURIComponent(code)}.svg`;
}

export type TextSegment = { kind: "text"; value: string } | { kind: "symbol"; value: string };

/** Separa un texto en trozos de texto normal y símbolos `{…}`, conservando el orden. */
export function splitSymbols(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/\{[^}]+\}/g)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ kind: "text", value: text.slice(cursor, start) });
    segments.push({ kind: "symbol", value: match[0] });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) segments.push({ kind: "text", value: text.slice(cursor) });
  return segments;
}
