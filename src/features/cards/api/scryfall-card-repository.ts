import { getServerEnv } from "@/config/env";
import { createHttpClient, HttpError, type HttpClient } from "@/lib/http/http-client";
import type { Paginated } from "@/types/pagination";
import type { CardRepository } from "../services/card-repository";
import type { Card, CardSearchParams, Legality, ManaColor, Rarity } from "../types/card";
import type { ScryfallCard, ScryfallCatalog, ScryfallList } from "./scryfall-types";

/** Los datos de cartas cambian como mucho a diario: se cachean 24 h en el servidor. */
const CACHE_ONE_DAY = { next: { revalidate: 60 * 60 * 24 } } as const;

/**
 * Adaptador de `CardRepository` sobre la API pública de Scryfall.
 *
 * Normas de uso de Scryfall que este adaptador debe respetar:
 *  - Cabeceras `User-Agent` identificable y `Accept` en todas las peticiones.
 *  - Máximo ~10 peticiones/segundo (50–100 ms entre peticiones).
 *  - Cachear los datos al menos 24 horas.
 *
 * Solo debe usarse en el servidor (Server Components, Route Handlers, Server Actions).
 */
export class ScryfallCardRepository implements CardRepository {
  constructor(private readonly http: HttpClient) {}

  async search({ query, page = 1, order = "name" }: CardSearchParams): Promise<Paginated<Card>> {
    try {
      const list = await this.http.get<ScryfallList<ScryfallCard>>("/cards/search", {
        query: { q: query, page, order },
        ...CACHE_ONE_DAY,
      });
      return {
        items: list.data.map(toDomainCard),
        totalCount: list.total_cards ?? list.data.length,
        hasMore: list.has_more,
        page,
      };
    } catch (error) {
      // Scryfall responde 404 cuando una búsqueda válida no tiene resultados.
      if (error instanceof HttpError && error.status === 404) {
        return { items: [], totalCount: 0, hasMore: false, page };
      }
      throw error;
    }
  }

  async autocomplete(partialName: string): Promise<string[]> {
    const catalog = await this.http.get<ScryfallCatalog>("/cards/autocomplete", {
      query: { q: partialName },
      ...CACHE_ONE_DAY,
    });
    return catalog.data;
  }

  async getById(id: string): Promise<Card> {
    const card = await this.http.get<ScryfallCard>(
      `/cards/${encodeURIComponent(id)}`,
      CACHE_ONE_DAY,
    );
    return toDomainCard(card);
  }

  async getByName(exactName: string): Promise<Card> {
    const card = await this.http.get<ScryfallCard>("/cards/named", {
      query: { exact: exactName },
      ...CACHE_ONE_DAY,
    });
    return toDomainCard(card);
  }
}

/** Factoría: compone el adaptador con la configuración del entorno. */
export function createScryfallCardRepository(): CardRepository {
  const env = getServerEnv();
  const http = createHttpClient(env.SCRYFALL_API_URL, {
    "User-Agent": env.SCRYFALL_USER_AGENT,
    Accept: "application/json;q=0.9,*/*;q=0.8",
  });
  return new ScryfallCardRepository(http);
}

/** Traduce una carta de Scryfall al modelo de dominio. */
function toDomainCard(card: ScryfallCard): Card {
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;

  return {
    id: card.id,
    oracleId: card.oracle_id ?? card.id,
    name: card.name,
    manaCost: card.mana_cost,
    manaValue: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text,
    colors: (card.colors ?? []) as ManaColor[],
    colorIdentity: card.color_identity as ManaColor[],
    rarity: card.rarity as Rarity,
    set: { code: card.set, name: card.set_name },
    collectorNumber: card.collector_number,
    images: imageUris && {
      small: imageUris.small,
      normal: imageUris.normal,
      large: imageUris.large,
      artCrop: imageUris.art_crop,
    },
    prices: { usd: card.prices.usd ?? undefined, eur: card.prices.eur ?? undefined },
    legalities: card.legalities as Record<string, Legality>,
  };
}
