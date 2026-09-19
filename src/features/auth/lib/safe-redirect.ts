import type { Route } from "next";
import { routes } from "@/config/routes";

/**
 * Devuelve a dónde ir tras iniciar sesión, solo si es una ruta interna.
 *
 * El parámetro `?next=` lo puede escribir cualquiera en un enlace. Sin esta comprobación,
 * `/login?next=https://sitio-malicioso.example` llevaría al usuario, ya autenticado y
 * confiado, a una web ajena (redirección abierta).
 */
export function safeRedirectPath(next: string | null | undefined, fallback: Route = routes.decks) {
  // "//dominio" y "/\dominio" son URLs de otro sitio para el navegador aunque empiecen por "/".
  const isInternalPath =
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\");

  return isInternalPath ? (next as Route) : fallback;
}
