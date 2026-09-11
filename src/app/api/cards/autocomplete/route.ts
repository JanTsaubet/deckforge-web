import { NextResponse } from "next/server";
import { z } from "zod";
import { createScryfallCardRepository } from "@/features/cards/api/scryfall-card-repository";

/** Proxy cacheado al autocompletado de nombres de carta de Scryfall. */

const querySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  // Con menos de dos caracteres no hay nada que sugerir: lista vacía, no un error.
  if (!parsed.success) {
    return NextResponse.json([]);
  }

  try {
    const names = await createScryfallCardRepository().autocomplete(parsed.data.q);

    return NextResponse.json(names, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Fallo al autocompletar nombres de carta", error);
    return NextResponse.json({ error: "No se han podido cargar las sugerencias" }, { status: 502 });
  }
}
