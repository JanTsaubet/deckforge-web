import type { CardRuling } from "../types/card";
import { OracleText } from "./oracle-text";

const DATE_FORMAT = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "UTC" });

const SOURCE_LABELS: Record<CardRuling["source"], string> = {
  wotc: "Wizards of the Coast",
  scryfall: "Scryfall",
};

interface CardRulingsProps {
  /** `null` si la petición falló: se avisa en su sitio sin tumbar la ficha entera. */
  rulingsPromise: Promise<CardRuling[] | null>;
}

/**
 * Aclaraciones de reglas. Es un componente de servidor asíncrono: se renderiza dentro de
 * un <Suspense>, así que la ficha se muestra sin esperar a que lleguen.
 */
export async function CardRulings({ rulingsPromise }: CardRulingsProps) {
  const rulings = await rulingsPromise;

  if (rulings === null) {
    return <p className="text-sm text-muted">No se han podido cargar las aclaraciones.</p>;
  }

  if (rulings.length === 0) {
    return <p className="text-sm text-muted">Esta carta no tiene aclaraciones oficiales.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rulings.map((ruling, index) => (
        <li key={index} className="rounded-lg bg-surface px-4 py-3">
          <OracleText text={ruling.comment} />
          <p className="mt-2 text-xs text-muted">
            {SOURCE_LABELS[ruling.source]} ·{" "}
            <time dateTime={ruling.publishedAt}>
              {DATE_FORMAT.format(new Date(ruling.publishedAt))}
            </time>
          </p>
        </li>
      ))}
    </ul>
  );
}
