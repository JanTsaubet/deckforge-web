import { Upload } from "lucide-react";
import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createServerDeckRepository } from "@/features/decks/api/server-deck-repository";
import { CreateDeckDialog } from "@/features/decks/components/create-deck-dialog";
import { DeckLibrary } from "@/features/decks/components/deck-library";
import type { DeckSummary } from "@/features/decks/types/deck";
import { HttpError } from "@/lib/http/http-client";

export const metadata: Metadata = { title: "Mis mazos" };

async function loadMyDecks(): Promise<DeckSummary[]> {
  try {
    const repository = await createServerDeckRepository();
    return await repository.listMine();
  } catch (error) {
    // Había cookie (si no, el proxy ya habría redirigido) pero la API no la acepta:
    // sesión caducada o cerrada en otro sitio. Toca volver a entrar.
    if (error instanceof HttpError && error.status === 401) {
      redirect(`${routes.login}?next=${encodeURIComponent(routes.decks)}` as Route);
    }
    throw error;
  }
}

/** Pantalla 1 · Biblioteca de mazos del usuario. */
export default async function DecksPage() {
  const decks = await loadMyDecks();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis mazos"
        description="Organiza, filtra y gestiona todos tus mazos en un solo lugar."
        actions={
          <>
            <Button variant="secondary" disabled title="La importación llega en esta misma fase">
              <Upload className="size-4" aria-hidden />
              Importar
            </Button>
            <CreateDeckDialog />
          </>
        }
      />
      <DeckLibrary decks={decks} />
    </div>
  );
}
