"use client";

import { useLocalPreference } from "@/lib/hooks/use-local-preference";
import { VIEW_MODES, type ViewMode } from "../components/view-mode-picker";

/**
 * Cómo prefiere ver las cartas quien mira. Cada pantalla guarda la suya: al editar se suele
 * querer la lista, con todo a la vista, y al leer un mazo ajeno, las imágenes.
 */
export function useViewMode(storageKey: string, modes: readonly ViewMode[] = VIEW_MODES) {
  const isAllowed = (value: unknown): value is ViewMode => modes.includes(value as ViewMode);
  return useLocalPreference<ViewMode>(storageKey, modes[0] ?? "text", isAllowed);
}
