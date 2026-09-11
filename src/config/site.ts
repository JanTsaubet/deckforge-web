import type { Route } from "next";
import { routes } from "./routes";

export const siteConfig = {
  name: "DeckForge",
  description:
    "Construye, analiza y comparte tus mazos de Magic: The Gathering con una experiencia rápida y fluida.",
} as const;

export interface NavItem {
  label: string;
  href: Route;
}

/** Navegación principal visible en la cabecera de la app. */
export const mainNav: readonly NavItem[] = [
  { label: "Mis mazos", href: routes.decks },
  { label: "Buscar", href: routes.search },
];
