import type { Route } from "next";

/**
 * Única fuente de verdad para las URLs de la app.
 * Los componentes nunca escriben rutas "a mano": si una ruta cambia, solo se toca aquí.
 */
export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  decks: "/decks",
  deckImport: "/decks/import",
  search: "/search",
  settings: "/settings",
  deck: (deckId: string) => `/decks/${encodeURIComponent(deckId)}` as Route,
  deckEditor: (deckId: string) => `/decks/${encodeURIComponent(deckId)}/edit` as Route,
  card: (cardId: string) => `/cards/${encodeURIComponent(cardId)}` as Route,
  profile: (username: string) => `/u/${encodeURIComponent(username)}` as Route,
} as const;
