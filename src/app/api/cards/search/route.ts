import { NextResponse } from "next/server";
import { z } from "zod";
import { createScryfallCardRepository } from "@/features/cards/api/scryfall-card-repository";
import { HttpError } from "@/lib/http/http-client";

/**
 * Proxy cacheado a la búsqueda de Scryfall.
 *
 * El navegador nunca llama a Scryfall directamente: así controlamos el límite de
 * peticiones, enviamos el `User-Agent` obligatorio y aprovechamos la caché del servidor.
 */

const querySchema = z.object({
  q: z.string().trim().min(1).max(500),
  page: z.coerce.number().int().min(1).max(100).default(1),
  order: z.enum(["name", "cmc", "released", "rarity", "usd", "edhrec"]).default("name"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parámetros de búsqueda no válidos" },
      { status: 400 },
    );
  }

  const { q, page, order } = parsed.data;

  try {
    const results = await createScryfallCardRepository().search({ query: q, page, order });

    return NextResponse.json(results, {
      // Los datos de cartas cambian como mucho a diario.
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    // Scryfall responde 400/422 cuando la sintaxis de la consulta es incorrecta;
    // su mensaje (`details`) es útil para el usuario, así que se lo devolvemos.
    if (error instanceof HttpError && (error.status === 400 || error.status === 422)) {
      const details = (error.body as { details?: string } | null)?.details;
      return NextResponse.json({ error: details ?? "La consulta no es válida" }, { status: 400 });
    }

    console.error("Fallo al buscar cartas en Scryfall", error);
    return NextResponse.json({ error: "No se ha podido completar la búsqueda" }, { status: 502 });
  }
}
