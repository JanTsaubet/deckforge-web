const FORMATTERS = {
  USD: new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }),
  EUR: new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }),
} as const;

export type PriceCurrency = keyof typeof FORMATTERS;

/**
 * Formatea un precio con las convenciones españolas (coma decimal).
 * Scryfall da los precios como texto ("9.90") para no perder decimales.
 */
export function formatPrice(
  value: string | undefined,
  currency: PriceCurrency,
): string | undefined {
  if (!value) return undefined;

  const amount = Number(value);
  return Number.isFinite(amount) ? FORMATTERS[currency].format(amount) : undefined;
}
