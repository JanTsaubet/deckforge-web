export const SEARCH_TABS = [
  { id: "cards", label: "Cartas" },
  { id: "decks", label: "Mazos" },
] as const;

export type SearchTabId = (typeof SEARCH_TABS)[number]["id"];

/** Convierte el parámetro `?tab=` de la URL en una pestaña válida (por defecto, cartas). */
export function parseSearchTab(value: string | undefined): SearchTabId {
  return SEARCH_TABS.find((tab) => tab.id === value)?.id ?? "cards";
}
