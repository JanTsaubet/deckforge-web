import Link from "next/link";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "../lib/format-price";
import type { Card } from "../types/card";

/** Impresiones visibles antes de resumir el resto con un contador. */
const MAX_VISIBLE_PRINTINGS = 25;

interface CardPrintingsProps {
  /** `null` si la petición falló: se avisa en su sitio sin tumbar la ficha entera. */
  printingsPromise: Promise<Card[] | null>;
  /** La impresión que se está viendo, para resaltarla. */
  currentId: string;
}

/**
 * Ediciones en las que se ha impreso la carta, de la más reciente a la más antigua.
 * Componente de servidor asíncrono: llega en streaming dentro de un <Suspense>.
 */
export async function CardPrintings({ printingsPromise, currentId }: CardPrintingsProps) {
  const printings = await printingsPromise;

  if (printings === null) {
    return <p className="text-sm text-muted">No se han podido cargar las impresiones.</p>;
  }

  const visible = printings.slice(0, MAX_VISIBLE_PRINTINGS);
  const hidden = printings.length - visible.length;

  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-border overflow-hidden rounded-lg bg-surface">
        {visible.map((printing) => {
          const isCurrent = printing.id === currentId;
          const price =
            formatPrice(printing.prices.eur, "EUR") ?? formatPrice(printing.prices.usd, "USD");

          return (
            <li key={printing.id}>
              <Link
                href={routes.card(printing.id)}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2 text-sm transition-colors duration-200 hover:bg-surface-raised",
                  isCurrent && "bg-accent/10 text-foreground",
                )}
              >
                <span className="min-w-0 truncate">
                  {printing.set.name}{" "}
                  <span className="text-muted">
                    ({printing.set.code.toUpperCase()})
                    {printing.releasedAt && ` · ${printing.releasedAt.slice(0, 4)}`}
                  </span>
                </span>
                <span className="shrink-0 text-muted">{price ?? "—"}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {hidden > 0 && <p className="text-xs text-muted">Y {hidden} impresiones más.</p>}
    </div>
  );
}
