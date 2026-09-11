import { Layers } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import type { DeckSummary } from "../types/deck";
import { DeckCard } from "./deck-card";

interface DeckLibraryProps {
  decks: DeckSummary[];
}

/** Biblioteca de mazos: barra de filtros + rejilla de mazos (o estado vacío). */
export function DeckLibrary({ decks }: DeckLibraryProps) {
  return (
    <div className="flex flex-col gap-6">
      <PlaceholderPanel
        title="Filtros y ordenación"
        phase="Fase 2"
        description="Formato, colores, carpetas y etiquetas, fecha de modificación y vista rejilla/lista."
      />

      {decks.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aún no tienes mazos"
          description="Crea tu primer mazo desde cero o importa una lista en texto (formato MTGA/MTGO)."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => (
            <li key={deck.id}>
              <DeckCard deck={deck} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
