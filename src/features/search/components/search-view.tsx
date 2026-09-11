import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import type { SearchTabId } from "../types/search-tab";
import { CardSearchPanel } from "./card-search-panel";
import { SearchTabs } from "./search-tabs";

interface SearchViewProps {
  activeTab: SearchTabId;
  query: string;
}

/** Estructura de la pantalla de búsqueda: pestañas, filtros y resultados. */
export function SearchView({ activeTab, query }: SearchViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buscar"
        description="Encuentra cartas con la sintaxis de Scryfall o descubre mazos de la comunidad."
      />
      <SearchTabs activeTab={activeTab} />
      {activeTab === "cards" ? <CardSearchSection query={query} /> : <DeckSearchSection />}
    </div>
  );
}

function CardSearchSection({ query }: { query: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <PlaceholderPanel
        title="Filtros"
        phase="Fase 1"
        description="Colores, tipo, coste de maná, rareza, set, formato y precio; sincronizados con la consulta de texto."
        className="h-fit"
      />
      <CardSearchPanel initialQuery={query} />
    </div>
  );
}

function DeckSearchSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <PlaceholderPanel
        title="Filtros"
        phase="Fase 5"
        description="Formato, comandante, colores, presupuesto y popularidad."
        className="lg:min-h-80"
      />
      <PlaceholderPanel
        title="Resultados"
        phase="Fase 5"
        description="Mazos públicos con portada, autor, formato y valoraciones."
        className="min-h-80"
      />
    </div>
  );
}
