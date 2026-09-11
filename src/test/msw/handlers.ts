import { http, HttpResponse } from "msw";
import type {
  ScryfallCard,
  ScryfallCatalog,
  ScryfallList,
} from "@/features/cards/api/scryfall-types";

/** Consulta reservada en los tests para provocar la respuesta "sin resultados" de Scryfall. */
export const NO_RESULTS_QUERY = "consulta-sin-resultados";

/** Carta de ejemplo con la forma exacta que devuelve la API de Scryfall. */
export const scryfallCardFixture: ScryfallCard = {
  object: "card",
  id: "11111111-2222-3333-4444-555555555555",
  oracle_id: "99999999-8888-7777-6666-555555555555",
  name: "Llanowar Elves",
  mana_cost: "{G}",
  cmc: 1,
  type_line: "Creature — Elf Druid",
  oracle_text: "{T}: Add {G}.",
  colors: ["G"],
  color_identity: ["G"],
  rarity: "common",
  set: "dom",
  set_name: "Dominaria",
  collector_number: "168",
  image_uris: {
    small: "https://cards.scryfall.io/small/front/1/1/llanowar.jpg",
    normal: "https://cards.scryfall.io/normal/front/1/1/llanowar.jpg",
    large: "https://cards.scryfall.io/large/front/1/1/llanowar.jpg",
    png: "https://cards.scryfall.io/png/front/1/1/llanowar.png",
    art_crop: "https://cards.scryfall.io/art_crop/front/1/1/llanowar.jpg",
    border_crop: "https://cards.scryfall.io/border_crop/front/1/1/llanowar.jpg",
  },
  prices: { usd: "0.35", usd_foil: "1.20", eur: null, tix: "0.02" },
  legalities: { commander: "legal", modern: "legal", standard: "not_legal" },
};

export const handlers = [
  http.get("https://api.scryfall.com/cards/search", ({ request }) => {
    const query = new URL(request.url).searchParams.get("q");

    // Scryfall responde 404 cuando una búsqueda válida no encuentra nada.
    if (query === NO_RESULTS_QUERY) {
      return HttpResponse.json(
        { object: "error", status: 404, details: "No cards found" },
        { status: 404 },
      );
    }

    const list: ScryfallList<ScryfallCard> = {
      object: "list",
      data: [scryfallCardFixture],
      has_more: true,
      total_cards: 2,
    };
    return HttpResponse.json(list);
  }),

  http.get("https://api.scryfall.com/cards/autocomplete", () => {
    const catalog: ScryfallCatalog = {
      object: "catalog",
      total_values: 1,
      data: ["Llanowar Elves"],
    };
    return HttpResponse.json(catalog);
  }),
];
