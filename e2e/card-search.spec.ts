import { expect, test } from "@playwright/test";

/** Cartas de prueba sin imagen: la rejilla las pinta con su nombre y no sale a la red. */
function makeCards(pageNumber: number, count = 12) {
  return Array.from({ length: count }, (_, index) => ({
    id: `pagina${pageNumber}-carta${index}`,
    oracleId: `oracle${pageNumber}-${index}`,
    name: `Carta ${pageNumber}-${index}`,
    manaValue: 1,
    typeLine: "Creature — Test",
    colors: [],
    colorIdentity: [],
    rarity: "common",
    set: { code: "tst", name: "Edición de prueba" },
    collectorNumber: String(index),
    prices: {},
    legalities: {},
  }));
}

const TOTAL_PAGES = 2;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/cards/autocomplete**", (route) => route.fulfill({ json: [] }));

  await page.route("**/api/cards/search**", (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") ?? "1");

    return route.fulfill({
      json: {
        items: makeCards(pageNumber),
        totalCount: 24,
        hasMore: pageNumber < TOTAL_PAGES,
        page: pageNumber,
      },
    });
  });
});

test("el scroll carga la página siguiente sin pulsar nada", async ({ page }) => {
  await page.goto("/search?tab=cards&q=t%3Acreature");

  const cards = page.locator('a[href^="/cards/"]');
  await expect(cards).toHaveCount(12);

  // Acercar el final de la lista a la pantalla es lo que activa la carga automática.
  await page.getByRole("button", { name: "Cargar más cartas" }).scrollIntoViewIfNeeded();

  await expect(cards).toHaveCount(24);
});

test("los filtros reescriben la consulta y la URL", async ({ page }) => {
  await page.goto("/search?tab=cards&q=t%3Acreature");

  await page.getByRole("group", { name: "Colores" }).getByRole("button", { name: "Verde" }).click();

  await expect(page.getByLabel("Buscar cartas")).toHaveValue("c:g t:creature");
  await expect(page).toHaveURL(/q=c%3Ag\+t%3Acreature/);
});

test("la consulta de la URL llega a los controles", async ({ page }) => {
  await page.goto("/search?tab=cards&q=id%3C%3Dwub%20t%3Ainstant%20mv%3C%3D3");

  await expect(page.getByLabel("Tipo de carta")).toHaveValue("instant");
  await expect(page.getByLabel("Valor de maná")).toHaveValue("3");
  await expect(
    page.getByRole("group", { name: "Identidad de color" }).getByRole("button", { name: "Azul" }),
  ).toHaveAttribute("aria-pressed", "true");
});
