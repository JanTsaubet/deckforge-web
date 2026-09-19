import { Upload } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { buttonStyles } from "@/components/ui/button";
import { routes } from "@/config/routes";
import {
  createServerDeckRepository,
  createServerFolderRepository,
} from "@/features/decks/api/server-deck-repository";
import { CreateDeckDialog } from "@/features/decks/components/create-deck-dialog";
import { DeckLibrary } from "@/features/decks/components/deck-library";
import { parseLibraryFilters } from "@/features/decks/lib/library-filters";
import type { DeckFolder, DeckSummary } from "@/features/decks/types/deck";
import { HttpError } from "@/lib/http/http-client";

export const metadata: Metadata = { title: "Mis mazos" };

interface DecksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadLibrary(): Promise<[DeckSummary[], DeckFolder[]]> {
  try {
    const [decks, folders] = await Promise.all([
      createServerDeckRepository().then((repository) => repository.listMine()),
      createServerFolderRepository().then((repository) => repository.listMine()),
    ]);
    return [decks, folders];
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
export default async function DecksPage({ searchParams }: DecksPageProps) {
  const [[decks, folders], filters] = await Promise.all([
    loadLibrary(),
    searchParams.then(parseLibraryFilters),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Mis mazos"
        description="Organiza, filtra y gestiona todos tus mazos en un solo lugar."
        actions={
          <>
            <Link href={routes.deckImport} className={buttonStyles({ variant: "secondary" })}>
              <Upload className="size-4" aria-hidden />
              Importar
            </Link>
            <CreateDeckDialog />
          </>
        }
      />
      <DeckLibrary decks={decks} folders={folders} filters={filters} />
    </div>
  );
}
