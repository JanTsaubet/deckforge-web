import type { Paginated } from "@/types/pagination";
import type { Card, CardSearchParams } from "../types/card";

/** Error de nuestra propia API, con un mensaje ya apto para mostrar al usuario. */
export class CardsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CardsApiError";
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new CardsApiError(
      body?.error ?? "Ha ocurrido un error al consultar las cartas",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Cliente de navegador para los Route Handlers de cartas.
 * Devuelve ya el modelo de dominio, porque la traducción desde Scryfall ocurre en el servidor.
 */
export function fetchCardSearch({
  query,
  page = 1,
  order = "name",
}: CardSearchParams): Promise<Paginated<Card>> {
  const params = new URLSearchParams({ q: query, page: String(page), order });
  return getJson<Paginated<Card>>(`/api/cards/search?${params}`);
}

export function fetchCardAutocomplete(term: string): Promise<string[]> {
  const params = new URLSearchParams({ q: term });
  return getJson<string[]>(`/api/cards/autocomplete?${params}`);
}
