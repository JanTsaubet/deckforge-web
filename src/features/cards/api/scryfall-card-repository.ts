import { getServerEnv } from "@/config/env";
import { createHttpClient, HttpError, type HttpClient } from "@/lib/http/http-client";
import type { Paginated } from "@/types/pagination";
import type { CardRepository } from "../services/card-repository";
import type {
  Card,
  CardFace,
  CardImages,
  CardRuling,
  CardSearchParams,
  Legality,
  ManaColor,
  Rarity,
} from "../types/card";
import type {
  ScryfallCard,
  ScryfallCardFace,
  ScryfallCatalog,
  ScryfallImageUris,
  ScryfallList,
  ScryfallRuling,
} from "./scryfall-types";

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
    const list = await this.searchOrEmpty({ q: query, page, order });

    return {
      items: list.data.map(toDomainCard),
      totalCount: list.total_cards ?? list.data.length,
      hasMore: list.has_more,
      page,
    };
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

  async getRulings(cardId: string): Promise<CardRuling[]> {
    const list = await this.http.get<ScryfallList<ScryfallRuling>>(
      `/cards/${encodeURIComponent(cardId)}/rulings`,
      CACHE_ONE_DAY,
    );

    return list.data.map((ruling) => ({
      source: ruling.source,
      publishedAt: ruling.published_at,
      comment: ruling.comment,
    }));
  }

  /**
   * Solo se pide la primera página (hasta 175 impresiones). Las cartas con más, como las
   * tierras básicas, se cortan ahí: para esta vista basta con las más recientes.
   */
  async getPrintings(oracleId: string): Promise<Card[]> {
    const list = await this.searchOrEmpty({
      q: `oracleid:${oracleId}`,
      unique: "prints",
      order: "released",
      dir: "desc",
    });
    return list.data.map(toDomainCard);
  }

  /** Scryfall responde 404 cuando una búsqueda válida no tiene resultados: es una lista vacía. */
  private async searchOrEmpty(
    query: Record<string, string | number>,
  ): Promise<ScryfallList<ScryfallCard>> {
    try {
      return await this.http.get<ScryfallList<ScryfallCard>>("/cards/search", {
        query,
        ...CACHE_ONE_DAY,
      });
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        return { object: "list", data: [], has_more: false, total_cards: 0 };
      }
      throw error;
    }
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

function toDomainImages(uris: ScryfallImageUris | undefined): CardImages | undefined {
  return (
    uris && { small: uris.small, normal: uris.normal, large: uris.large, artCrop: uris.art_crop }
  );
}

function toDomainFace(face: ScryfallCardFace): CardFace {
  return {
    name: face.name,
    // La cara trasera de una transformable trae "" como coste: no tiene coste.
    manaCost: face.mana_cost || undefined,
    typeLine: face.type_line,
    oracleText: face.oracle_text,
    images: toDomainImages(face.image_uris),
  };
}

/**
 * Traduce una carta de Scryfall al modelo de dominio.
 * En las cartas de varias caras, coste, texto e imágenes vienen por cara y no arriba.
 */
function toDomainCard(card: ScryfallCard): Card {
  const faces = card.card_faces?.map(toDomainFace) ?? [];

  return {
    id: card.id,
    oracleId: card.oracle_id ?? card.id,
    name: card.name,
    manaCost: card.mana_cost || faces[0]?.manaCost,
    manaValue: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text,
    colors: (card.colors ?? []) as ManaColor[],
    colorIdentity: card.color_identity as ManaColor[],
    rarity: card.rarity as Rarity,
    set: { code: card.set, name: card.set_name },
    collectorNumber: card.collector_number,
    images: toDomainImages(card.image_uris) ?? faces[0]?.images,
    faces,
    prices: { usd: card.prices.usd ?? undefined, eur: card.prices.eur ?? undefined },
    legalities: card.legalities as Record<string, Legality>,
    releasedAt: card.released_at,
  };
}
