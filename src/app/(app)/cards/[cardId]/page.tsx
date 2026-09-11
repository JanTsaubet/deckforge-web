import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

export const metadata: Metadata = { title: "Carta" };

interface CardPageProps {
  params: Promise<{ cardId: string }>;
}

/** Detalle de carta: imagen, texto oracle, impresiones, legalidades, precios y mazos que la usan. */
export default async function CardPage({ params }: CardPageProps) {
  const { cardId } = await params;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Detalle de carta" description={`Id de Scryfall: ${cardId}`} />
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <PlaceholderPanel
          title="Imagen"
          phase="Fase 1"
          description="Con animación de giro para cartas de doble cara."
          className="aspect-[5/7]"
        />
        <div className="flex flex-col gap-4">
          <PlaceholderPanel title="Texto oracle y legalidades" phase="Fase 1" />
          <PlaceholderPanel title="Impresiones y precios" phase="Fase 1" />
          <PlaceholderPanel title="Mazos que la usan" phase="Fase 5" />
        </div>
      </div>
    </div>
  );
}
