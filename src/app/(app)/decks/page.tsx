import { Plus, Upload } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DeckLibrary } from "@/features/decks/components/deck-library";

export const metadata: Metadata = { title: "Mis mazos" };

/** Pantalla 1 · Biblioteca de mazos del usuario. */
export default function DecksPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis mazos"
        description="Organiza, filtra y gestiona todos tus mazos en un solo lugar."
        actions={
          <>
            <Button variant="secondary">
              <Upload className="size-4" aria-hidden />
              Importar
            </Button>
            <Button>
              <Plus className="size-4" aria-hidden />
              Nuevo mazo
            </Button>
          </>
        }
      />
      {/* TODO(Fase 2): obtener los mazos con DeckRepository.listMine(). */}
      <DeckLibrary decks={[]} />
    </div>
  );
}
