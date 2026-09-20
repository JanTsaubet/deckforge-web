import type { ManaColor } from "@/features/cards/types/card";
import type { DeckBoard } from "@/features/decks/types/deck";
import { cardCategory, CARD_CATEGORIES, type CardCategory } from "./card-category";
import type { EditorEntry } from "./editor-entries";

/** Barras de la curva de maná: 0, 1, 2… hasta "7 o más". */
export const CURVE_BUCKETS = 8;

export interface DeckStats {
  /** Copias por zona. */
  byBoard: Record<DeckBoard, number>;
  /** Cartas que se juegan: comandante + mazo principal. */
  playable: number;
  /** Cartas que no son tierra por valor de maná; la última barra es "7 o más". */
  curve: number[];
  /** Valor de maná medio de las cartas que no son tierra. */
  averageManaValue: number;
  /** Símbolos de maná de color en los costes (cuánto "pide" cada color). */
  colorPips: Record<ManaColor, number>;
  byCategory: Record<CardCategory, number>;
  /** Precio del comandante y el mazo principal, en euros; sin las cartas sin precio. */
  priceEur: number;
  /** Cartas (distintas) sin precio conocido: el total puede quedarse corto. */
  cardsWithoutPrice: number;
}

const COLORS: ManaColor[] = ["W", "U", "B", "R", "G"];

/**
 * Estadísticas de un mazo para el panel de análisis. Solo cuentan el comandante y el mazo
 * principal: el banquillo y las "quizás" no se juegan.
 */
export function computeDeckStats(entries: EditorEntry[]): DeckStats {
  const byBoard: Record<DeckBoard, number> = { commander: 0, main: 0, sideboard: 0, maybeboard: 0 };
  const curve = Array.from({ length: CURVE_BUCKETS }, () => 0);
  const colorPips: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  const byCategory = Object.fromEntries(CARD_CATEGORIES.map((category) => [category, 0])) as Record<
    CardCategory,
    number
  >;
  let priceEur = 0;
  let cardsWithoutPrice = 0;
  let spellCount = 0;
  let manaValueSum = 0;

  for (const { card, board, quantity } of entries) {
    byBoard[board] += quantity;
    if (board !== "commander" && board !== "main") continue;

    const category = cardCategory(card.typeLine);
    byCategory[category] += quantity;

    if (category !== "land") {
      const bucket = Math.min(Math.floor(card.manaValue), CURVE_BUCKETS - 1);
      curve[bucket] = (curve[bucket] ?? 0) + quantity;
      spellCount += quantity;
      manaValueSum += card.manaValue * quantity;
    }

    for (const color of COLORS) {
      colorPips[color] += countPips(card.manaCost, color) * quantity;
    }

    if (card.priceEur === undefined) cardsWithoutPrice += 1;
    else priceEur += card.priceEur * quantity;
  }

  return {
    byBoard,
    playable: byBoard.commander + byBoard.main,
    curve,
    averageManaValue: spellCount === 0 ? 0 : manaValueSum / spellCount,
    colorPips,
    byCategory,
    priceEur: Math.round(priceEur * 100) / 100,
    cardsWithoutPrice,
  };
}

/**
 * Símbolos de un color en un coste: `{2}{R}{R}` tiene dos de rojo. Los híbridos (`{R/G}`) y
 * los pirexianos (`{R/P}`) cuentan para cada color que incluyen.
 */
export function countPips(manaCost: string | undefined, color: ManaColor): number {
  if (!manaCost) return 0;
  return (manaCost.match(/\{[^}]+\}/g) ?? []).filter((symbol) =>
    symbol.slice(1, -1).split("/").includes(color),
  ).length;
}
