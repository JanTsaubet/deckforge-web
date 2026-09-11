import type { NextConfig } from "next";

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
};

export default nextConfig;
