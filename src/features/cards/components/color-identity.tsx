import { cn } from "@/lib/utils/cn";
import { MANA_COLOR_LABELS } from "../constants/mana-colors";
import type { ManaColor } from "../types/card";
import { ManaSymbol } from "./mana-symbol";

interface ColorIdentityProps {
  colors: ManaColor[];
  className?: string;
}

/**
 * Identidad de color con los símbolos oficiales ({W}{U}…), descrita en palabras para los
 * lectores de pantalla. Sin colores no pinta nada: una lista vacía puede ser un mazo incoloro
 * o uno cuyas cartas aún no están en el catálogo, y no hay forma de distinguirlos.
 */
export function ColorIdentity({ colors, className }: ColorIdentityProps) {
  if (colors.length === 0) return null;

  return (
    <span
      role="img"
      aria-label={`Colores: ${colors.map((color) => MANA_COLOR_LABELS[color]).join(", ")}`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {colors.map((color) => (
        <ManaSymbol key={color} symbol={`{${color}}`} decorative className="size-4" />
      ))}
    </span>
  );
}
