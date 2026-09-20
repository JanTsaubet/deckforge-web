import type { ManaColor } from "@/features/cards/types/card";
import { toCatalogCard, type ApiCard } from "@/features/decks/api/catalog-card-mapper";
import type { CatalogCard } from "@/features/decks/types/deck";

/**
 * Identidad de color para filtrar: `undefined` no filtra; `[]` es incolora (solo cartas
 * incoloras caben en un comandante incoloro).
 */
export type IdentityFilter = ManaColor[] | undefined;

/**
 * Busca cartas en el catálogo de DeckForge desde el navegador. La petición va a la web
 * (`/api/v1/…`), que la reenvía a la API: mismo origen, sin CORS.
 */
export async function searchCatalog(
  query: string,
  identity: IdentityFilter,
  signal?: AbortSignal,
): Promise<CatalogCard[]> {
  const params = new URLSearchParams({ q: query, limit: "12" });
  if (identity) params.set("identity", identity.length === 0 ? "C" : identity.join(""));

  const response = await fetch(`/api/v1/cards/search?${params}`, { signal });
  if (!response.ok) throw new Error(`La búsqueda ha fallado (${response.status})`);
  const cards = (await response.json()) as ApiCard[];
  return cards.map(toCatalogCard);
}
