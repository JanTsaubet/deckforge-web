import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createScryfallCardRepository } from "@/features/cards/api/scryfall-card-repository";
import { CardDetail } from "@/features/cards/components/card-detail";
import type { Card } from "@/features/cards/types/card";
import { HttpError } from "@/lib/http/http-client";

interface CardPageProps {
  params: Promise<{ cardId: string }>;
}

/**
 * `cache` evita pedir la carta dos veces: `generateMetadata` y la propia página
 * comparten el resultado dentro de la misma petición.
 */
const loadCard = cache(async (cardId: string): Promise<Card | null> => {
  try {
    return await createScryfallCardRepository().getById(cardId);
  } catch (error) {
    // Un id inexistente es un 404 de Scryfall, no un fallo de la aplicación.
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { cardId } = await params;
  const card = await loadCard(cardId);

  if (!card) return { title: "Carta no encontrada" };

  return {
    title: card.name,
    description: card.oracleText ?? card.typeLine,
    openGraph: {
      title: card.name,
      description: card.typeLine,
      images: card.images ? [{ url: card.images.normal }] : undefined,
    },
  };
}

/** Detalle de carta. Se renderiza en el servidor: no necesita JavaScript en el cliente. */
export default async function CardPage({ params }: CardPageProps) {
  const { cardId } = await params;
  const card = await loadCard(cardId);

  if (!card) notFound();

  return <CardDetail card={card} />;
}
