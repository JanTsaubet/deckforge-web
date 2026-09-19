import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ImportDeckForm } from "@/features/decks/components/import-deck-form";

export const metadata: Metadata = { title: "Importar mazo" };

/** Importar un mazo desde una lista en texto (MTG Arena, MTGO, Moxfield…). */
export default function ImportDeckPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Importar mazo"
        description="Pega una lista en texto y revisa las cartas antes de crear el mazo."
      />
      <ImportDeckForm />
    </div>
  );
}
