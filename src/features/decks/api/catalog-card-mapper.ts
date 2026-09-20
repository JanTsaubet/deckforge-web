import type { components } from "@/lib/api/openapi";
import type { CatalogCard } from "../types/deck";

export type ApiCard = components["schemas"]["CardDto"];

/** Los `null` de la API pasan a `undefined`: el dominio no distingue "nulo" de "ausente". */
export function toCatalogCard(card: ApiCard): CatalogCard {
  return {
    id: card.id,
    oracleId: card.oracleId ?? undefined,
    name: card.name,
    layout: card.layout,
    manaCost: card.manaCost ?? undefined,
    manaValue: card.manaValue,
    typeLine: card.typeLine,
    oracleText: card.oracleText ?? undefined,
    colors: card.colors,
    colorIdentity: card.colorIdentity,
    rarity: card.rarity,
    setCode: card.setCode,
    setName: card.setName,
    imageSmall: card.imageSmall ?? undefined,
    imageNormal: card.imageNormal ?? undefined,
    imageArtCrop: card.imageArtCrop ?? undefined,
    priceEur: card.priceEur ?? undefined,
    priceUsd: card.priceUsd ?? undefined,
    legalities: card.legalities,
    gameChanger: card.gameChanger,
  };
}
