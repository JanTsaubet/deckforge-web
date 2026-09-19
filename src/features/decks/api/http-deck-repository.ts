import type { components } from "@/lib/api/openapi";
import type { HttpClient } from "@/lib/http/http-client";
import type { Paginated } from "@/types/pagination";
import type { CreateDeckInput, DeckRepository, UpdateDeckInput } from "../services/deck-repository";
import type { Deck, DeckSummary } from "../types/deck";

type ApiDeckSummary = components["schemas"]["DeckSummaryDto"];
type ApiDeck = components["schemas"]["DeckDto"];

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Datos de usuario: nunca se cachean entre peticiones. */
const NO_STORE = { cache: "no-store" } as const;

/**
 * `DeckRepository` sobre la API de DeckForge.
 *
 * Los tipos de la API se generan de su especificación OpenAPI (`npm run api:types`): si un
 * endpoint cambia de forma, este fichero deja de compilar en lugar de fallar en producción.
 */
export class HttpDeckRepository implements DeckRepository {
  constructor(private readonly http: HttpClient) {}

  async listMine(): Promise<DeckSummary[]> {
    const decks = await this.http.get<ApiDeckSummary[]>("/v1/decks", NO_STORE);
    return decks.map(toDeckSummary);
  }

  searchPublic(): Promise<Paginated<DeckSummary>> {
    // La búsqueda de mazos públicos llega en la Fase 5: la API aún no tiene ese endpoint.
    return Promise.reject(new Error("La búsqueda de mazos públicos todavía no está disponible"));
  }

  async getById(deckId: string): Promise<Deck> {
    const deck = await this.http.get<ApiDeck>(deckPath(deckId), NO_STORE);
    return toDeck(deck);
  }

  async create(input: CreateDeckInput): Promise<Deck> {
    const deck = await this.http.request<ApiDeck>("/v1/decks", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
      ...NO_STORE,
    });
    return toDeck(deck);
  }

  async update(deckId: string, input: UpdateDeckInput): Promise<Deck> {
    const deck = await this.http.request<ApiDeck>(deckPath(deckId), {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
      ...NO_STORE,
    });
    return toDeck(deck);
  }

  async remove(deckId: string): Promise<void> {
    await this.http.request<null>(deckPath(deckId), { method: "DELETE", ...NO_STORE });
  }

  async duplicate(deckId: string): Promise<Deck> {
    const copy = await this.http.request<ApiDeck>(`${deckPath(deckId)}/duplicate`, {
      method: "POST",
      ...NO_STORE,
    });
    return toDeck(copy);
  }
}

function deckPath(deckId: string): string {
  return `/v1/decks/${encodeURIComponent(deckId)}`;
}

function toDeckSummary(deck: ApiDeckSummary): DeckSummary {
  return {
    id: deck.id,
    ownerUsername: deck.ownerUsername,
    name: deck.name,
    format: deck.format,
    visibility: deck.visibility,
    folderId: deck.folderId ?? undefined,
    tags: deck.tags,
    colorIdentity: deck.colorIdentity,
    // La API la calcula con su catálogo local: sin cartas conocidas, no hay portada.
    coverImageUrl: deck.coverImageUrl ?? undefined,
    cardCount: deck.cardCount,
    updatedAt: deck.updatedAt,
  };
}

function toDeck(deck: ApiDeck): Deck {
  return {
    id: deck.id,
    ownerUsername: deck.ownerUsername,
    name: deck.name,
    description: deck.description ?? undefined,
    format: deck.format,
    visibility: deck.visibility,
    folderId: deck.folderId ?? undefined,
    tags: deck.tags,
    entries: deck.entries,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
}
