import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import { routes } from "@/config/routes";

// TODO(Fase 2): sustituir por generateMetadata con el nombre real del mazo.
export const metadata: Metadata = { title: "Mazo" };

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

/** Vista pública de un mazo: lectura, estadísticas, compartir y exportar. */
export default async function DeckPage({ params }: DeckPageProps) {
  const { deckId } = await params;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Mazo ${deckId}`}
        description="Vista pública: lista agrupada por tipo, estadísticas y opciones para compartir."
        actions={
          <Link href={routes.deckEditor(deckId)} className={buttonStyles()}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <PlaceholderPanel
          title="Lista de cartas"
          phase="Fase 3"
          description="Agrupada por tipo, con vistas de texto, imágenes o columnas."
          className="min-h-96"
        />
        <div className="flex flex-col gap-4">
          <PlaceholderPanel
            title="Estadísticas"
            phase="Fase 3"
            description="Curva de maná, colores, tipos y precio total."
            className="min-h-48"
          />
          <PlaceholderPanel
            title="Compartir y exportar"
            phase="Fase 5"
            description="Enlace, texto MTGA/MTGO, imagen y embed."
          />
        </div>
      </div>
    </div>
  );
}
