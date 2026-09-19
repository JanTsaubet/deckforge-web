import { cn } from "@/lib/utils/cn";
import { manaSymbolUrl } from "../lib/mana-symbols";

interface ManaSymbolProps {
  /** Símbolo en formato de Scryfall: `{G}`, `{T}`, `{W/U}`… */
  symbol: string;
  /** Si el contexto ya lo describe (p. ej. un coste con su aria-label), el icono es decorativo. */
  decorative?: boolean;
  className?: string;
}

/** Símbolo oficial de Magic dibujado con su SVG de Scryfall. */
export function ManaSymbol({ symbol, decorative = false, className }: ManaSymbolProps) {
  return (
    // Iconos SVG de 16 px servidos ya optimizados por el CDN de Scryfall:
    // next/image no aporta nada aquí y complica su uso en tests.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={manaSymbolUrl(symbol)}
      alt={decorative ? "" : symbol}
      aria-hidden={decorative || undefined}
      width={16}
      height={16}
      loading="lazy"
      className={cn("inline-block size-[1.05em] align-[-0.15em]", className)}
    />
  );
}
