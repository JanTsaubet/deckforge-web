import type { ManaColor } from "../types/card";

/** Fondo y color de texto de cada color de maná, con los tokens del tema. */
export const MANA_COLOR_CLASSES: Record<ManaColor, string> = {
  W: "bg-mana-w text-black",
  U: "bg-mana-u text-black",
  B: "bg-mana-b text-white",
  R: "bg-mana-r text-black",
  G: "bg-mana-g text-black",
};

export const MANA_COLOR_LABELS: Record<ManaColor, string> = {
  W: "Blanco",
  U: "Azul",
  B: "Negro",
  R: "Rojo",
  G: "Verde",
};
