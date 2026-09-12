import { cn } from "@/lib/utils/cn";
import { MANA_COLOR_CLASSES, MANA_GENERIC_CLASS } from "../constants/mana-colors";

interface ManaCostProps {
  /** Coste en formato de Scryfall, por ejemplo `{2}{G}{G}`. */
  cost: string;
  className?: string;
}

/**
 * Muestra un coste de maná como una fila de símbolos redondos.
 * TODO(Fase 1): sustituir por los SVG oficiales de `/symbology`, que representan
 * correctamente los símbolos híbridos y los de Phyrexian.
 */
export function ManaCost({ cost, className }: ManaCostProps) {
  const symbols = cost.match(/\{[^}]+\}/g) ?? [];
  if (symbols.length === 0) return null;

  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-1", className)}
      aria-label={`Coste de maná: ${cost}`}
    >
      {symbols.map((symbol, index) => {
        const value = symbol.slice(1, -1);

        return (
          <span
            key={`${symbol}-${index}`}
            aria-hidden
            className={cn(
              "grid size-5 place-items-center rounded-full text-[11px] font-bold",
              MANA_COLOR_CLASSES[value as keyof typeof MANA_COLOR_CLASSES] ?? MANA_GENERIC_CLASS,
            )}
          >
            {value.replace("/", "")}
          </span>
        );
      })}
    </span>
  );
}
