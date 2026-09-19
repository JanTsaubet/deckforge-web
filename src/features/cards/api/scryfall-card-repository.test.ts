import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { NO_RESULTS_QUERY, scryfallDoubleFacedFixture } from "@/test/msw/handlers";
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
    expect(card?.faces).toEqual([]);
    expect(card?.releasedAt).toBe("2018-04-27");
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

describe("cartas de dos caras", () => {
  it("toma coste, imagen y caras de card_faces cuando no vienen arriba", async () => {
    server.use(
      http.get("https://api.scryfall.com/cards/:id", () =>
        HttpResponse.json(scryfallDoubleFacedFixture),
      ),
    );

    const card = await createScryfallCardRepository().getById(scryfallDoubleFacedFixture.id);

    // Sin esto, la ficha de una transformable salía sin coste ni texto de reglas.
    expect(card.manaCost).toBe("{U}");
    expect(card.images?.normal).toContain("/front/");
    expect(card.faces).toHaveLength(2);
    expect(card.faces[0]?.oracleText).toContain("upkeep");
    expect(card.faces[1]?.images?.normal).toContain("/back/");
  });

  it("la cara trasera sin coste queda como undefined, no como cadena vacía", async () => {
    server.use(
      http.get("https://api.scryfall.com/cards/:id", () =>
        HttpResponse.json(scryfallDoubleFacedFixture),
      ),
    );

    const card = await createScryfallCardRepository().getById(scryfallDoubleFacedFixture.id);

    expect(card.faces[1]?.manaCost).toBeUndefined();
  });
});

describe("rulings e impresiones", () => {
  it("traduce los rulings al dominio", async () => {
    const rulings = await createScryfallCardRepository().getRulings("cualquier-id");

    expect(rulings).toEqual([
      {
        source: "wotc",
        publishedAt: "2018-04-27",
        comment: expect.stringContaining("Llanowar Elves"),
      },
    ]);
  });

  it("pide todas las impresiones de la carta, las más recientes primero", async () => {
    let params: URLSearchParams | null = null;

    server.use(
      http.get("https://api.scryfall.com/cards/search", ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ object: "list", data: [], has_more: false, total_cards: 0 });
      }),
    );

    await createScryfallCardRepository().getPrintings("oracle-123");

    const sent = params as URLSearchParams | null;
    expect(sent?.get("q")).toBe("oracleid:oracle-123");
    expect(sent?.get("unique")).toBe("prints");
    expect(sent?.get("order")).toBe("released");
    expect(sent?.get("dir")).toBe("desc");
  });

  it("sin impresiones devuelve una lista vacía en lugar de fallar", async () => {
    server.use(
      http.get("https://api.scryfall.com/cards/search", () =>
        HttpResponse.json({ object: "error", status: 404 }, { status: 404 }),
      ),
    );

    await expect(createScryfallCardRepository().getPrintings("sin-impresiones")).resolves.toEqual(
      [],
    );
  });
});
