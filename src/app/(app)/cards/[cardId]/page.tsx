import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createScryfallCardRepository } from "@/features/cards/api/scryfall-card-repository";
import { CardDetail } from "@/features/cards/components/card-detail";
import { CardPrintings } from "@/features/cards/components/card-printings";
import { CardRulings } from "@/features/cards/components/card-rulings";
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

/** Convierte un fallo en `null`: una sección secundaria no debe tumbar la ficha entera. */
function orNull<T>(promise: Promise<T>, what: string): Promise<T | null> {
  return promise.catch((error: unknown) => {
    console.error(`No se han podido cargar ${what}`, error);
    return null;
  });
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { cardId } = await params;
  const card = await loadCard(cardId);

  if (!card) return { title: "Carta no encontrada" };

  return {
    title: card.name,
    description: card.oracleText ?? card.faces[0]?.oracleText ?? card.typeLine,
    openGraph: {
      title: card.name,
      description: card.typeLine,
      images: card.images ? [{ url: card.images.normal }] : undefined,
    },
  };
}

/** Detalle de carta, renderizado en el servidor. Rulings e impresiones llegan en streaming. */
export default async function CardPage({ params }: CardPageProps) {
  const { cardId } = await params;
  const card = await loadCard(cardId);

  if (!card) notFound();

  const repository = createScryfallCardRepository();
  // Sin await: la ficha se envía ya y estas secciones llegan cuando estén listas.
  const rulings = orNull(repository.getRulings(card.id), "las aclaraciones");
  const printings = orNull(repository.getPrintings(card.oracleId), "las impresiones");

  return (
    <CardDetail
      card={card}
      rulings={
        <Suspense fallback={<Skeleton className="h-24" />}>
          <CardRulings rulingsPromise={rulings} />
        </Suspense>
      }
      printings={
        <Suspense fallback={<Skeleton className="h-40" />}>
          <CardPrintings printingsPromise={printings} currentId={card.id} />
        </Suspense>
      }
    />
  );
}
