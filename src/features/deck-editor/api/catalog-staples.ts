import type { ManaColor } from "@/features/cards/types/card";
import { toCatalogCard, type ApiCard } from "@/features/decks/api/catalog-card-mapper";
import type { CatalogCard } from "@/features/decks/types/deck";

/** Funciones que propone el bloque de recomendaciones, en el orden en que se monta un mazo. */
export const STAPLE_ROLES = ["ramp", "draw", "removal", "land"] as const;
export type StapleRole = (typeof STAPLE_ROLES)[number];

export const STAPLE_ROLE_LABELS: Record<StapleRole, string> = {
  ramp: "Rampa",
  draw: "Robo",
  removal: "Remoción",
  land: "Tierras",
};

export interface StapleGroup {
  role: StapleRole;
  cards: CatalogCard[];
}

interface ApiStapleGroup {
  role: string;
  cards: ApiCard[];
}

/**
 * Las cartas que casi todo mazo de esa identidad juega, por funciones. Como la búsqueda, la
 * petición va a la web, que la reenvía a la API.
 */
export async function fetchStaples(
  identity: ManaColor[],
  limit: number,
  signal?: AbortSignal,
): Promise<StapleGroup[]> {
  const params = new URLSearchParams({
    identity: identity.length === 0 ? "C" : identity.join(""),
    limit: String(limit),
  });

  const response = await fetch(`/api/v1/cards/staples?${params}`, { signal });
  if (!response.ok)
    throw new Error(`No se han podido cargar las recomendaciones (${response.status})`);

  const groups = (await response.json()) as ApiStapleGroup[];
  return groups.flatMap((group) =>
    isRole(group.role) ? [{ role: group.role, cards: group.cards.map(toCatalogCard) }] : [],
  );
}

const isRole = (role: string): role is StapleRole => STAPLE_ROLES.includes(role as StapleRole);
