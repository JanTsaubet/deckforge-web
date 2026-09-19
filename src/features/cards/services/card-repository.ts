import type { Paginated } from "@/types/pagination";
import type { Card, CardIdentifier, CardRuling, CardSearchParams } from "../types/card";

/**
 * Contrato de acceso a cartas (principio de inversión de dependencias).
 * Páginas y hooks dependen de esta abstracción, nunca de Scryfall ni de `fetch`.
 */
export interface CardRepository {
  search(params: CardSearchParams): Promise<Paginated<Card>>;
  autocomplete(partialName: string): Promise<string[]>;
  getById(id: string): Promise<Card>;
  getByName(exactName: string): Promise<Card>;
  /** Aclaraciones de reglas de la carta. */
  getRulings(cardId: string): Promise<CardRuling[]>;
  /** Impresiones de la carta, de la más reciente a la más antigua. */
  getPrintings(oracleId: string): Promise<Card[]>;
  /**
   * Varias cartas de una vez (para importar listas). El resultado va en el mismo orden que
   * los identificadores, con `undefined` en los que no existen.
   */
  getCollection(identifiers: CardIdentifier[]): Promise<Array<Card | undefined>>;
}
