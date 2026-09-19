const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** Unidades de mayor a menor, con su duración en segundos. */
const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

/**
 * Fecha relativa en español: "hace 5 minutos", "ayer", "hace 3 semanas"…
 * `now` se puede inyectar para que el resultado sea predecible en los tests.
 */
export function formatRelativeDate(isoDate: string, now: Date = new Date()): string {
  const seconds = (new Date(isoDate).getTime() - now.getTime()) / 1000;

  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return RELATIVE_FORMAT.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return "ahora mismo";
}
