import type { DeckBoard, DeckFormat } from "../types/deck";

/** Una línea de carta reconocida en la lista. */
export interface DecklistLine {
  /** Número de línea en el texto original (desde 1), para señalar errores. */
  lineNumber: number;
  quantity: number;
  name: string;
  /** Código de edición, si la línea lo trae: `(M11)` → `m11`. */
  setCode?: string;
  collectorNumber?: string;
  board: DeckBoard;
}

export interface DecklistParseResult {
  lines: DecklistLine[];
  /** Líneas que no se han podido interpretar. */
  invalidLines: Array<{ lineNumber: number; text: string }>;
  /** Nombre del mazo, si la lista lo trae (sección "About" de MTG Arena). */
  deckName?: string;
}

export interface ParseDecklistOptions {
  /** En Commander y Brawl se aplica la convención de MTGO para el comandante (ver abajo). */
  format?: DeckFormat;
}

/** Cabeceras de sección que se reconocen, en inglés (Arena, MTGO, Moxfield…) y en español. */
const SECTION_HEADERS: Record<string, DeckBoard | "about"> = {
  about: "about",
  commander: "commander",
  commanders: "commander",
  comandante: "commander",
  companion: "sideboard",
  deck: "main",
  main: "main",
  mainboard: "main",
  "main deck": "main",
  mazo: "main",
  sideboard: "sideboard",
  side: "sideboard",
  banquillo: "sideboard",
  maybeboard: "maybeboard",
  maybe: "maybeboard",
  considering: "maybeboard",
};

/** "Sideboard", "SIDEBOARD:", "Sideboard (15)"… */
const HEADER_PATTERN = /^([a-z ]+?)\s*(?:\(\d+\))?\s*:?$/i;

/**
 * Categorías que algunas webs escriben entre grupos de cartas ("Creatures (30)"). No son
 * zonas: se ignoran sin cambiar de sección.
 */
const CATEGORY_PATTERN = /^[\p{L} ]+\s*\(\d+\)$/u;

/** "4 Lightning Bolt", "4x Lightning Bolt", "SB: 2 Duress"… (la cantidad es opcional). */
const CARD_PATTERN = /^(?:(SB:)\s*)?(?:(\d+)\s*x?\s+)?(.+)$/i;

/** Edición y número de coleccionista al final: "Sol Ring (C21) 263". */
const PRINTING_PATTERN = /\s+\(([a-z0-9]{2,6})\)(?:\s+(\S+))?$/i;

/** Marcas de acabado de Arena y Moxfield (`*F*` foil, `*E*` grabado) que no afectan a la carta. */
const FINISH_MARKERS = /(?:\s+\*[a-z]+\*)+$/i;

/**
 * Interpreta una lista de cartas en texto, tal y como la exportan MTG Arena, MTGO y las webs
 * de mazos más usadas.
 *
 * - **Arena:** secciones con cabecera (`Commander`, `Deck`, `Sideboard`…) y edición opcional:
 *   `1 Sol Ring (C21) 263`.
 * - **MTGO:** sin cabeceras; una línea en blanco separa el mazo principal del banquillo.
 * - **Comandante en MTGO:** MTGO guarda el comandante en el banquillo. En Commander y Brawl,
 *   si no hay sección de comandante y el "banquillo" tiene una o dos cartas, esas cartas son
 *   el comandante (o la pareja de comandantes).
 *
 * Es una función pura: no resuelve nombres contra ningún catálogo, solo lee el texto.
 */
export function parseDecklist(
  text: string,
  options: ParseDecklistOptions = {},
): DecklistParseResult {
  const result: DecklistParseResult = { lines: [], invalidLines: [] };

  let section: DeckBoard | "about" = "main";
  let usesHeaders = false;
  let blankAfterCards = false;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line) {
      if (result.lines.length > 0) blankAfterCards = true;
      return;
    }
    if (line.startsWith("//") || line.startsWith("#")) return;

    const header = HEADER_PATTERN.exec(line)?.[1]?.toLowerCase();
    const headerSection = header ? SECTION_HEADERS[header] : undefined;
    if (headerSection) {
      section = headerSection;
      usesHeaders = true;
      return;
    }

    if (section === "about") {
      const name = /^name\s+(.+)$/i.exec(line)?.[1];
      if (name) result.deckName = name.trim();
      return;
    }

    if (CATEGORY_PATTERN.test(line)) return;

    const card = parseCardLine(line);
    if (!card) {
      result.invalidLines.push({ lineNumber, text: line });
      return;
    }

    // Formato MTGO: sin cabeceras, lo que va tras la primera línea en blanco es banquillo.
    const board: DeckBoard =
      card.sideboardPrefix || (!usesHeaders && blankAfterCards) ? "sideboard" : section;

    result.lines.push({ lineNumber, ...card.line, board });
  });

  if (options.format === "commander" || options.format === "brawl") {
    promoteSideboardCommander(result.lines);
  }
  return result;
}

function parseCardLine(
  line: string,
): { line: Omit<DecklistLine, "lineNumber" | "board">; sideboardPrefix: boolean } | undefined {
  const match = CARD_PATTERN.exec(line.replace(FINISH_MARKERS, ""));
  if (!match) return undefined;

  const [, sideboardPrefix, rawQuantity, rest = ""] = match;
  const quantity = rawQuantity === undefined ? 1 : Number(rawQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1) return undefined;

  const printing = PRINTING_PATTERN.exec(rest);
  const name = normalizeName(printing ? rest.slice(0, printing.index) : rest);
  // Separadores como "-----" o "===" no son cartas: un nombre tiene al menos una letra.
  if (!/\p{L}/u.test(name)) return undefined;

  return {
    sideboardPrefix: Boolean(sideboardPrefix),
    line: {
      quantity,
      name,
      setCode: printing?.[1]?.toLowerCase(),
      collectorNumber: printing?.[2],
    },
  };
}

/** Espacios normalizados y el separador de cartas partidas unificado: "A /// B" → "A // B". */
function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s*\/{2,3}\s*/g, " // ")
    .replace(/\s+/g, " ");
}

/** Convención de MTGO: un banquillo de una o dos cartas en Commander es el comandante. */
function promoteSideboardCommander(lines: DecklistLine[]): void {
  if (lines.some((line) => line.board === "commander")) return;

  const sideboard = lines.filter((line) => line.board === "sideboard");
  const copies = sideboard.reduce((total, line) => total + line.quantity, 0);
  if (copies < 1 || copies > 2) return;

  for (const line of sideboard) line.board = "commander";
}

/** Total de copias por zona: para el resumen en vivo mientras se escribe la lista. */
export function countByBoard(lines: DecklistLine[]): Record<DeckBoard, number> {
  const counts: Record<DeckBoard, number> = { commander: 0, main: 0, sideboard: 0, maybeboard: 0 };
  for (const line of lines) counts[line.board] += line.quantity;
  return counts;
}
