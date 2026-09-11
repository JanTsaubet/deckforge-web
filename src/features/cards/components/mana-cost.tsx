import { cn } from "@/lib/utils/cn";

/** Fondo de cada símbolo de color, con los tokens de maná del tema. */
const SYMBOL_CLASSES: Record<string, string> = {
  W: "bg-mana-w text-black",
  U: "bg-mana-u text-black",
  B: "bg-mana-b text-white",
  R: "bg-mana-r text-black",
  G: "bg-mana-g text-black",
};

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
              SYMBOL_CLASSES[value] ?? "bg-mana-c text-black",
            )}
          >
            {value.replace("/", "")}
          </span>
        );
      })}
    </span>
  );
}
