import { cn } from "@/lib/utils/cn";
import { ManaSymbol } from "./mana-symbol";

interface ManaCostProps {
  /** Coste en formato de Scryfall, por ejemplo `{2}{G}{G}`. */
  cost: string;
  className?: string;
}

/** Coste de maná con los símbolos oficiales, descrito entero para lectores de pantalla. */
export function ManaCost({ cost, className }: ManaCostProps) {
  const symbols = cost.match(/\{[^}]+\}/g) ?? [];
  if (symbols.length === 0) return null;

  return (
    <span
      role="img"
      aria-label={`Coste de maná: ${cost}`}
      className={cn("inline-flex flex-wrap items-center gap-0.5", className)}
    >
      {symbols.map((symbol, index) => (
        <ManaSymbol key={`${symbol}-${index}`} symbol={symbol} decorative className="size-5" />
      ))}
    </span>
  );
}
