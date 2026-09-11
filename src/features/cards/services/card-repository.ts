import type { Paginated } from "@/types/pagination";
import type { Card, CardSearchParams } from "../types/card";

/**
 * Contrato de acceso a cartas (principio de inversión de dependencias).
 * Páginas y hooks dependen de esta abstracción, nunca de Scryfall ni de `fetch`.
 */
export interface CardRepository {
  search(params: CardSearchParams): Promise<Paginated<Card>>;
  autocomplete(partialName: string): Promise<string[]>;
  getById(id: string): Promise<Card>;
  getByName(exactName: string): Promise<Card>;
}
