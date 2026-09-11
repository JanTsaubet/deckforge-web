import type { Metadata } from "next";
import { SearchView } from "@/features/search/components/search-view";
import { parseSearchTab } from "@/features/search/types/search-tab";

export const metadata: Metadata = { title: "Buscar" };

interface SearchPageProps {
  searchParams: Promise<{ tab?: string; q?: string }>;
}

/**
 * Pantalla 3 · Búsqueda de cartas y de mazos de la comunidad.
 * El estado de búsqueda vive en la URL (?tab=&q=) para que los resultados se puedan compartir.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { tab, q } = await searchParams;
  return <SearchView activeTab={parseSearchTab(tab)} query={q ?? ""} />;
}
