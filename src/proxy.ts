import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protección de las pantallas privadas (en Next.js 16 el antiguo middleware se llama proxy).
 *
 * Es una comprobación optimista: solo mira si existe la cookie de sesión, sin consultar la
 * API en cada navegación. Basta para no enseñar pantallas privadas a quien claramente no ha
 * entrado. La comprobación real la hace la API en cada petición (responde 401 si la sesión
 * no es válida), y la página redirige al acceso en ese caso.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // La vista de un mazo (/decks/:id) NO está aquí: los mazos públicos se comparten sin cuenta.
  matcher: ["/decks", "/decks/import", "/decks/:deckId/edit", "/settings/:path*"],
};
