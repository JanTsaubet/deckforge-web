import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import type { SearchTabId } from "../types/search-tab";
import { SearchTabs } from "./search-tabs";

interface SearchViewProps {
  activeTab: SearchTabId;
  query: string;
}

/** Estructura de la pantalla de búsqueda: pestañas, barra de consulta, filtros y resultados. */
export function SearchView({ activeTab, query }: SearchViewProps) {
  const isCardSearch = activeTab === "cards";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buscar"
        description="Encuentra cartas con la sintaxis de Scryfall o descubre mazos de la comunidad."
      />
      <SearchTabs activeTab={activeTab} />

      <PlaceholderPanel
        title={isCardSearch ? "Barra de búsqueda de cartas" : "Barra de búsqueda de mazos"}
        phase={isCardSearch ? "Fase 1" : "Fase 5"}
        description={
          query
            ? `Consulta actual: "${query}"`
            : "Autocompletado, historial y ayuda de sintaxis (t:, c:, mv, o:…)."
        }
      />

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <PlaceholderPanel
          title="Filtros"
          phase={isCardSearch ? "Fase 1" : "Fase 5"}
          description={
            isCardSearch
              ? "Colores, tipo, coste de maná, rareza, set, formato y precio."
              : "Formato, comandante, colores, presupuesto y popularidad."
          }
          className="lg:min-h-80"
        />
        <PlaceholderPanel
          title="Resultados"
          phase={isCardSearch ? "Fase 1" : "Fase 5"}
          description={
            isCardSearch
              ? "Rejilla de imágenes o lista, con scroll infinito y vista rápida."
              : "Mazos públicos con portada, autor, formato y valoraciones."
          }
          className="min-h-80"
        />
      </div>
    </div>
  );
}
