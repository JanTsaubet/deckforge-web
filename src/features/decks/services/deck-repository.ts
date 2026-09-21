import type { Paginated } from "@/types/pagination";
import type { Deck, DeckEntry, DeckSearchParams, DeckSummary } from "../types/deck";

/** Una carta al crear un mazo: sin etiquetas por carta, que llegan con el editor. */
export type NewDeckEntry = Pick<DeckEntry, "cardId" | "board" | "quantity">;

/**
 * Cambio de cartas: la cantidad final de una carta en una zona (0 la quita) y sus etiquetas.
 * Sin `tags`, la API conserva las que tuviera la carta.
 */
export type EntryChange = NewDeckEntry & { tags?: string[] };

/**
 * Datos para crear un mazo. Todo salvo el nombre es opcional: la API pone sus valores por
 * defecto. `entries` permite crearlo ya con cartas (importación) en una sola operación.
 */
export type CreateDeckInput = Pick<Deck, "name"> &
  Partial<Pick<Deck, "description" | "format" | "visibility" | "folderId" | "tags">> & {
    entries?: NewDeckEntry[];
  };

/**
 * Cambios en los datos del mazo. Las cartas no van aquí: se editarán con operaciones
 * propias (añadir, quitar, mover de zona) en el editor de la Fase 3.
 */
export type UpdateDeckInput = Partial<
  Pick<Deck, "name" | "description" | "format" | "visibility" | "tags">
> & {
  /** `null` saca el mazo de su carpeta. */
  folderId?: string | null;
};

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
  /** Copia un mazo propio, o uno público de otra persona, a la biblioteca del usuario. */
  duplicate(deckId: string): Promise<Deck>;
  /** Añade, quita o mueve cartas; todos los cambios se aplican juntos o ninguno. */
  updateEntries(deckId: string, changes: EntryChange[]): Promise<Deck>;
}

export interface DeckRepository extends DeckReader, DeckWriter {}
