import type { Paginated } from "@/types/pagination";
import type { Deck, DeckSearchParams, DeckSummary } from "../types/deck";

export type CreateDeckInput = Pick<Deck, "name" | "format" | "visibility"> & {
  description?: string;
};

export type UpdateDeckInput = Partial<
  Omit<Deck, "id" | "ownerUsername" | "createdAt" | "updatedAt">
>;

/**
 * Contratos de persistencia de mazos, separados por responsabilidad
 * (principio de segregación de interfaces): la vista pública de un mazo solo
 * necesita leer, mientras que el editor también escribe.
 *
 * Los implementará un adaptador HTTP contra `deckforge-api` (Fase 2).
 */
export interface DeckReader {
  listMine(): Promise<DeckSummary[]>;
  searchPublic(params: DeckSearchParams): Promise<Paginated<DeckSummary>>;
  getById(deckId: string): Promise<Deck>;
}

export interface DeckWriter {
  create(input: CreateDeckInput): Promise<Deck>;
  update(deckId: string, input: UpdateDeckInput): Promise<Deck>;
  remove(deckId: string): Promise<void>;
}

export interface DeckRepository extends DeckReader, DeckWriter {}
