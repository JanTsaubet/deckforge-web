import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { NO_RESULTS_QUERY } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { createScryfallCardRepository } from "./scryfall-card-repository";

describe("ScryfallCardRepository", () => {
  it("traduce la respuesta de Scryfall al modelo de dominio", async () => {
    const result = await createScryfallCardRepository().search({ query: "elves" });
    const card = result.items[0];

    expect(card).toBeDefined();
    expect(card?.name).toBe("Llanowar Elves");
    // `cmc` de Scryfall se expone como `manaValue` en el dominio.
    expect(card?.manaValue).toBe(1);
    expect(card?.set).toEqual({ code: "dom", name: "Dominaria" });
    expect(card?.images?.artCrop).toContain("art_crop");
  });

  it("convierte los precios nulos en undefined en lugar de propagar null", async () => {
    const result = await createScryfallCardRepository().search({ query: "elves" });

    expect(result.items[0]?.prices).toEqual({ usd: "0.35", eur: undefined });
  });

  it("devuelve una página vacía cuando Scryfall responde 404 por falta de resultados", async () => {
    const result = await createScryfallCardRepository().search({ query: NO_RESULTS_QUERY });

    expect(result).toEqual({ items: [], totalCount: 0, hasMore: false, page: 1 });
  });

  it("envía las cabeceras que Scryfall exige en todas las peticiones", async () => {
    let userAgent: string | null = null;
    let accept: string | null = null;

    server.use(
      http.get("https://api.scryfall.com/cards/search", ({ request }) => {
        userAgent = request.headers.get("user-agent");
        accept = request.headers.get("accept");
        return HttpResponse.json({ object: "list", data: [], has_more: false, total_cards: 0 });
      }),
    );

    await createScryfallCardRepository().search({ query: "elves" });

    expect(userAgent).toBeTruthy();
    expect(accept).toContain("application/json");
  });
});
