import { toCatalogCard, type ApiCard } from "@/features/decks/api/catalog-card-mapper";
import type { CatalogCard, DeckBoard } from "@/features/decks/types/deck";

/**
 * Una carta que cambió: cuántas copias había en esa zona y cuántas hay ahora. `from: 0` es
 * una carta que se añadió y `to: 0` una que se quitó; mover una carta de zona son dos
 * cambios, el que la quita de una zona y el que la pone en la otra.
 */
export interface DeckVersionChange {
  cardId: string;
  board: DeckBoard;
  from: number;
  to: number;
  /** Datos de la carta; ausente si el catálogo ya no la conoce. */
  card?: CatalogCard;
}

/** Una tanda de cambios del mazo. */
export interface DeckVersion {
  id: string;
  /** Cuándo empezaron los cambios, en ISO 8601. */
  createdAt: string;
  changes: DeckVersionChange[];
}

interface ApiVersion {
  id: string;
  createdAt: string;
  changes: Array<{
    cardId: string;
    board: DeckBoard;
    from: number;
    to: number;
    card: ApiCard | null;
  }>;
}

/**
 * Historial del mazo. Como la búsqueda, la petición va a la web, que la reenvía a la API con
 * la sesión de quien la hace: el historial solo lo ve el dueño del mazo.
 */
export async function fetchDeckVersions(
  deckId: string,
  signal?: AbortSignal,
): Promise<DeckVersion[]> {
  const response = await fetch(`/api/v1/decks/${deckId}/versions`, { signal });
  if (!response.ok) throw new Error(`No se ha podido cargar el historial (${response.status})`);

  const versions = (await response.json()) as ApiVersion[];
  return versions.map((version) => ({
    id: version.id,
    createdAt: version.createdAt,
    changes: version.changes.map(({ card, ...change }) => ({
      ...change,
      card: card ? toCatalogCard(card) : undefined,
    })),
  }));
}
