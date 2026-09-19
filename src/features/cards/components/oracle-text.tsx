import { cn } from "@/lib/utils/cn";
import { splitSymbols } from "../lib/mana-symbols";
import { ManaSymbol } from "./mana-symbol";

interface OracleTextProps {
  text: string;
  className?: string;
}

/**
 * Texto de reglas con los símbolos dibujados en línea ("{T}: Add {G}." con sus iconos)
 * y un párrafo por cada salto de línea.
 */
export function OracleText({ text, className }: OracleTextProps) {
  return (
    <div className={cn("space-y-2 text-sm leading-relaxed", className)}>
      {text.split("\n").map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex}>
          {splitSymbols(paragraph).map((segment, index) =>
            segment.kind === "symbol" ? (
              <ManaSymbol key={index} symbol={segment.value} />
            ) : (
              <span key={index}>{segment.value}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}
