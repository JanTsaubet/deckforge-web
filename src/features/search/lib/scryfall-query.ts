import type { ManaColor, Rarity } from "@/features/cards/types/card";

/**
 * Traducción en los dos sentidos entre los filtros visuales y la sintaxis de Scryfall.
 *
 * La consulta de texto es la única fuente de verdad: los filtros se derivan de ella y,
 * al tocar un control, se vuelve a construir la consulta. Los tokens que todavía no
 * sabemos representar con un control se conservan intactos en `rest`, de modo que usar
 * los filtros nunca borra lo que el usuario haya escrito a mano.
 */

/** Colores de maná en el orden canónico de Magic. */
export const MANA_COLORS = ["W", "U", "B", "R", "G"] as const satisfies readonly ManaColor[];

/** `c:` incluye esos colores, `c=` exactamente esos, `c<=` como mucho esos. */
export type ColorMode = "includes" | "exact" | "atMost";

export type NumericOperator = "<=" | "=" | ">=";

export interface CardFilters {
  colors: ManaColor[];
  colorMode: ColorMode;
  /** Identidad de color: la restricción que impone el comandante (`id<=`). */
  identity: ManaColor[];
  type: string;
  rarity: Rarity | "";
  manaValueOperator: NumericOperator;
  manaValue: number | null;
  format: string;
  /** Tokens sin control propio (`o:"draw a card"`, `is:commander`…). */
  rest: string;
}

export const EMPTY_FILTERS: CardFilters = {
  colors: [],
  colorMode: "includes",
  identity: [],
  type: "",
  rarity: "",
  manaValueOperator: "<=",
  manaValue: null,
  format: "",
  rest: "",
};

const COLOR_OPERATOR_TO_MODE: Record<string, ColorMode> = {
  ":": "includes",
  "=": "exact",
  "<=": "atMost",
};

const COLOR_MODE_TO_OPERATOR: Record<ColorMode, string> = {
  includes: ":",
  exact: "=",
  atMost: "<=",
};

const RARITY_VALUES: readonly Rarity[] = ["common", "uncommon", "rare", "mythic"];

const COLOR_PATTERN = /^(?:c|color)(<=|=|:)([a-z]+)$/i;
const IDENTITY_PATTERN = /^(?:id|identity)(?:<=|:)([a-z]+)$/i;
const TYPE_PATTERN = /^(?:t|type):(.+)$/i;
const RARITY_PATTERN = /^(?:r|rarity):([a-z]+)$/i;
const MANA_VALUE_PATTERN = /^(?:mv|cmc)(<=|>=|=)(\d+)$/i;
const FORMAT_PATTERN = /^(?:f|format):([a-z]+)$/i;

/** Separa la consulta en tokens respetando el texto entrecomillado. */
function tokenize(query: string): string[] {
  return query.match(/(?:[^\s"]|"[^"]*")+/g) ?? [];
}

/** Devuelve los colores de `wug` solo si todas las letras son colores; si no, `null`. */
function parseColorLetters(value: string): ManaColor[] | null {
  const letters = value.toUpperCase().split("");
  const colors = letters.filter((letter): letter is ManaColor =>
    (MANA_COLORS as readonly string[]).includes(letter),
  );

  if (colors.length === 0 || colors.length !== letters.length) return null;
  return sortByManaOrder(colors);
}

function sortByManaOrder(colors: readonly ManaColor[]): ManaColor[] {
  return [...new Set(colors)].sort((a, b) => MANA_COLORS.indexOf(a) - MANA_COLORS.indexOf(b));
}

function stripQuotes(value: string): string {
  return value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
}

function quoteIfNeeded(value: string): string {
  return /\s/.test(value) ? '"' + value + '"' : value;
}

function lettersOf(colors: readonly ManaColor[]): string {
  return sortByManaOrder(colors).join("").toLowerCase();
}

/** Extrae de una consulta de Scryfall los filtros que sabemos representar. */
export function parseScryfallQuery(query: string): CardFilters {
  const filters: CardFilters = { ...EMPTY_FILTERS };
  const rest: string[] = [];

  for (const token of tokenize(query)) {
    const color = COLOR_PATTERN.exec(token);
    const colorValue = color?.[2] ? parseColorLetters(color[2]) : null;
    if (color?.[1] && colorValue) {
      filters.colors = colorValue;
      filters.colorMode = COLOR_OPERATOR_TO_MODE[color[1]] ?? "includes";
      continue;
    }

    const identity = IDENTITY_PATTERN.exec(token);
    const identityValue = identity?.[1] ? parseColorLetters(identity[1]) : null;
    if (identityValue) {
      filters.identity = identityValue;
      continue;
    }

    const rarity = RARITY_PATTERN.exec(token);
    const rarityValue = rarity?.[1]?.toLowerCase() as Rarity | undefined;
    if (rarityValue && RARITY_VALUES.includes(rarityValue)) {
      filters.rarity = rarityValue;
      continue;
    }

    const manaValue = MANA_VALUE_PATTERN.exec(token);
    if (manaValue?.[1] && manaValue[2]) {
      filters.manaValueOperator = manaValue[1] as NumericOperator;
      filters.manaValue = Number(manaValue[2]);
      continue;
    }

    const format = FORMAT_PATTERN.exec(token);
    if (format?.[1]) {
      filters.format = format[1].toLowerCase();
      continue;
    }

    const type = TYPE_PATTERN.exec(token);
    if (type?.[1]) {
      filters.type = stripQuotes(type[1]);
      continue;
    }

    rest.push(token);
  }

  filters.rest = rest.join(" ");
  return filters;
}

/** Reconstruye la consulta de Scryfall a partir de los filtros. */
export function buildScryfallQuery(filters: CardFilters): string {
  const parts: string[] = [];

  if (filters.colors.length > 0) {
    parts.push(`c${COLOR_MODE_TO_OPERATOR[filters.colorMode]}${lettersOf(filters.colors)}`);
  }
  if (filters.identity.length > 0) parts.push(`id<=${lettersOf(filters.identity)}`);
  if (filters.type.trim()) parts.push(`t:${quoteIfNeeded(filters.type.trim())}`);
  if (filters.rarity) parts.push(`r:${filters.rarity}`);
  if (filters.manaValue !== null) parts.push(`mv${filters.manaValueOperator}${filters.manaValue}`);
  if (filters.format) parts.push(`f:${filters.format}`);
  if (filters.rest.trim()) parts.push(filters.rest.trim());

  return parts.join(" ");
}

/** `true` si hay algún filtro con control propio activo; el texto libre no cuenta. */
export function hasActiveFilters(filters: CardFilters): boolean {
  return (
    filters.colors.length > 0 ||
    filters.identity.length > 0 ||
    filters.type.trim() !== "" ||
    filters.rarity !== "" ||
    filters.manaValue !== null ||
    filters.format !== ""
  );
}
