import { http, HttpResponse } from "msw";
import type {
  ScryfallCard,
  ScryfallCatalog,
  ScryfallList,
  ScryfallRuling,
} from "@/features/cards/api/scryfall-types";

/** Consulta reservada en los tests para provocar la respuesta "sin resultados" de Scryfall. */
export const NO_RESULTS_QUERY = "consulta-sin-resultados";

function imageUris(slug: string, side: "front" | "back" = "front") {
  const base = `https://cards.scryfall.io`;
  return {
    small: `${base}/small/${side}/${slug}.jpg`,
    normal: `${base}/normal/${side}/${slug}.jpg`,
    large: `${base}/large/${side}/${slug}.jpg`,
    png: `${base}/png/${side}/${slug}.png`,
    art_crop: `${base}/art_crop/${side}/${slug}.jpg`,
    border_crop: `${base}/border_crop/${side}/${slug}.jpg`,
  };
}

/** Carta de una cara con la forma exacta que devuelve la API de Scryfall. */
export const scryfallCardFixture: ScryfallCard = {
  object: "card",
  id: "11111111-2222-3333-4444-555555555555",
  oracle_id: "99999999-8888-7777-6666-555555555555",
  name: "Llanowar Elves",
  layout: "normal",
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
  released_at: "2018-04-27",
  image_uris: imageUris("llanowar"),
  prices: { usd: "0.35", usd_foil: "1.20", eur: null, tix: "0.02" },
  legalities: { commander: "legal", modern: "legal", standard: "not_legal" },
};

/**
 * Carta transformable: sin imagen, coste ni texto arriba; todo va en `card_faces`.
 * Reproduce la forma real de Delver of Secrets.
 */
export const scryfallDoubleFacedFixture: ScryfallCard = {
  object: "card",
  id: "6904ea20-e504-47da-95a0-08739fdde260",
  oracle_id: "edd531b9-f615-4399-8c8c-1c5e18c4acbf",
  name: "Delver of Secrets // Insectile Aberration",
  layout: "transform",
  cmc: 1,
  type_line: "Creature — Human Wizard // Creature — Human Insect",
  colors: ["U"],
  color_identity: ["U"],
  rarity: "common",
  set: "isd",
  set_name: "Innistrad",
  collector_number: "51",
  released_at: "2011-09-30",
  card_faces: [
    {
      name: "Delver of Secrets",
      mana_cost: "{U}",
      type_line: "Creature — Human Wizard",
      oracle_text: "At the beginning of your upkeep, look at the top card of your library.",
      image_uris: imageUris("delver"),
    },
    {
      name: "Insectile Aberration",
      mana_cost: "",
      type_line: "Creature — Human Insect",
      oracle_text: "Flying",
      image_uris: imageUris("delver", "back"),
    },
  ],
  prices: { usd: "0.50", usd_foil: null, eur: "0.40", tix: null },
  legalities: { commander: "legal", pauper: "legal" },
};

export const scryfallRulingFixture: ScryfallRuling = {
  object: "ruling",
  oracle_id: "99999999-8888-7777-6666-555555555555",
  source: "wotc",
  published_at: "2018-04-27",
  comment: "Llanowar Elves puede usar su habilidad el turno en que entra si tiene prisa.",
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

  http.get("https://api.scryfall.com/cards/:id/rulings", () => {
    const list: ScryfallList<ScryfallRuling> = {
      object: "list",
      data: [scryfallRulingFixture],
      has_more: false,
    };
    return HttpResponse.json(list);
  }),
];
