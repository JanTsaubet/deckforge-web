import type { Paginated } from "@/types/pagination";
import type { Deck, DeckSearchParams, DeckSummary } from "../types/deck";

/** Datos para crear un mazo. Formato y visibilidad son opcionales: la API pone los suyos. */
export type CreateDeckInput = Pick<Deck, "name"> &
  Partial<Pick<Deck, "description" | "format" | "visibility">>;

/**
 * Cambios en los datos del mazo. Las cartas no van aquí: se editarán con operaciones
 * propias (añadir, quitar, mover de zona) en el editor de la Fase 3.
 */
export type UpdateDeckInput = Partial<Pick<Deck, "name" | "description" | "format" | "visibility">>;

/**
 * Contratos de persistencia de mazos, separados por responsabilidad
 * (principio de segregación de interfaces): la vista pública de un mazo solo
 * necesita leer, mientras que el editor también escribe.
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
