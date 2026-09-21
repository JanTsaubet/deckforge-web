"use client";

import { useState } from "react";
import { useLocalPreference } from "@/lib/hooks/use-local-preference";

/** Anchos elegidos para las columnas laterales; sin valor, la columna usa el de siempre. */
export interface ColumnWidths {
  left?: number;
  right?: number;
}

export type ColumnSide = keyof ColumnWidths;

/** Entre qué anchos se puede mover cada columna lateral. */
export const COLUMN_LIMITS: Record<ColumnSide, { min: number; max: number }> = {
  left: { min: 260, max: 560 },
  right: { min: 240, max: 480 },
};

/** Lo mínimo que se deja a la lista del mazo, que es lo que importa. */
export const MIN_DECK_COLUMN = 420;

const DEFAULT_WIDTHS: ColumnWidths = {};

const isWidth = (value: unknown) => value === undefined || typeof value === "number";
const isColumnWidths = (value: unknown): value is ColumnWidths =>
  typeof value === "object" &&
  value !== null &&
  isWidth((value as ColumnWidths).left) &&
  isWidth((value as ColumnWidths).right);

/**
 * Ancho de las columnas laterales del editor, a gusto de cada cual y recordado en su
 * navegador. Mientras se arrastra, el ancho vive solo en memoria (`live`) y se guarda al
 * soltar: guardar a cada píxel no aporta nada y despertaría a las demás pestañas abiertas.
 */
export function useEditorColumns() {
  const [saved, save] = useLocalPreference(
    "deckforge:columnas-editor",
    DEFAULT_WIDTHS,
    isColumnWidths,
  );
  const [live, setLive] = useState<ColumnWidths | null>(null);
  const widths = live ?? saved;

  return {
    widths,
    resize: (side: ColumnSide, width: number) => setLive({ ...widths, [side]: width }),
    commit: (side: ColumnSide, width: number) => {
      save({ ...saved, [side]: width });
      setLive(null);
    },
    reset: (side: ColumnSide) => {
      save({ ...saved, [side]: undefined });
      setLive(null);
    },
  };
}
