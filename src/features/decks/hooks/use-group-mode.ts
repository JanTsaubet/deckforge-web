"use client";

import { useLocalPreference } from "@/lib/hooks/use-local-preference";
import { GROUP_MODES, type GroupMode } from "../lib/deck-lines";

const isGroupMode = (value: unknown): value is GroupMode =>
  GROUP_MODES.includes(value as GroupMode);

/**
 * Cómo agrupa cada persona el mazo principal. Es la misma preferencia en el editor y en la
 * vista pública: quien piensa su mazo por etiquetas quiere leer así también los de otros.
 */
export function useGroupMode() {
  return useLocalPreference<GroupMode>("deckforge:agrupar-mazo", "type", isGroupMode);
}
