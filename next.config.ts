import type { NextConfig } from "next";

/** API de DeckForge (repositorio deckforge-api). */
const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Rutas tipadas: <Link href> y router.push() fallan en compilación si la ruta no existe.
  typedRoutes: true,

  images: {
    // Imágenes de cartas y símbolos de maná servidos por el CDN de Scryfall.
    remotePatterns: [
      { protocol: "https", hostname: "cards.scryfall.io" },
      { protocol: "https", hostname: "svgs.scryfall.io" },
    ],
  },

  /**
   * El navegador nunca llama a la API directamente: estas rutas se reenvían desde aquí.
   * Así la cookie de sesión pertenece al mismo origen que la web y no hace falta CORS.
   * Se evalúan después de las rutas propias, así que /api/cards/* sigue siendo de Next.
   */
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${apiBaseUrl}/api/auth/:path*` },
      { source: "/api/v1/:path*", destination: `${apiBaseUrl}/v1/:path*` },
    ];
  },
};

export default nextConfig;
