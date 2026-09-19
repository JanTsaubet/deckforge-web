import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createHttpClient, HttpError } from "@/lib/http/http-client";
import { server } from "@/test/msw/server";
import { HttpDeckRepository } from "./http-deck-repository";

const API = "http://api.test";

const apiDeck = {
  id: "8c1f4a3e-6f1b-4c2a-9d7e-1a2b3c4d5e6f",
  ownerUsername: "planeswalker",
  name: "Atraxa, superamigos",
  format: "commander",
  visibility: "private",
  cardCount: 0,
  updatedAt: "2026-09-19T10:00:00.000Z",
  createdAt: "2026-09-19T09:00:00.000Z",
  description: null,
  entries: [],
};

function repository() {
  return new HttpDeckRepository(createHttpClient(API, { cookie: "sesion=abc" }));
}

describe("HttpDeckRepository", () => {
  it("lista los mazos del usuario enviando su cookie", async () => {
    let cookie: string | null = null;
    server.use(
      http.get(`${API}/v1/decks`, ({ request }) => {
        cookie = request.headers.get("cookie");
        return HttpResponse.json([apiDeck]);
      }),
    );

    const decks = await repository().listMine();

    expect(cookie).toBe("sesion=abc");
    expect(decks).toEqual([
      expect.objectContaining({
        id: apiDeck.id,
        name: "Atraxa, superamigos",
        visibility: "private",
      }),
    ]);
  });

  it("sin datos de cartas todavía, el resumen no inventa identidad de color ni portada", async () => {
    server.use(http.get(`${API}/v1/decks`, () => HttpResponse.json([apiDeck])));

    const [deck] = await repository().listMine();

    expect(deck?.colorIdentity).toEqual([]);
    expect(deck?.coverImageUrl).toBeUndefined();
  });

  it("crea un mazo enviando solo lo que se le pasa, como JSON", async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/v1/decks`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(apiDeck, { status: 201 });
      }),
    );

    const deck = await repository().create({ name: "Atraxa, superamigos" });

    expect(body).toEqual({ name: "Atraxa, superamigos" });
    // `null` en la API se convierte en `undefined` en el dominio.
    expect(deck.description).toBeUndefined();
  });

  it("borra un mazo aunque la respuesta no tenga cuerpo (204)", async () => {
    server.use(http.delete(`${API}/v1/decks/:id`, () => new HttpResponse(null, { status: 204 })));

    await expect(repository().remove(apiDeck.id)).resolves.toBeUndefined();
  });

  it("propaga el estado HTTP para que la página decida (p. ej. 401 → iniciar sesión)", async () => {
    server.use(
      http.get(`${API}/v1/decks`, () =>
        HttpResponse.json({ message: "Necesitas iniciar sesión" }, { status: 401 }),
      ),
    );

    const error = await repository()
      .listMine()
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(401);
  });
});
