import { expect, test } from "@playwright/test";

/** Cartas de prueba sin imagen: la rejilla las pinta con su nombre y no sale a la red. */
function makeCards(pageNumber: number, count: number) {
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

const CARDS_PER_PAGE = 60;
const TOTAL_PAGES = 2;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/cards/autocomplete**", (route) => route.fulfill({ json: [] }));

  await page.route("**/api/cards/search**", (route) => {
    const pageNumber = Number(new URL(route.request().url()).searchParams.get("page") ?? "1");

    return route.fulfill({
      json: {
        items: makeCards(pageNumber, CARDS_PER_PAGE),
        totalCount: CARDS_PER_PAGE * TOTAL_PAGES,
        hasMore: pageNumber < TOTAL_PAGES,
        page: pageNumber,
      },
    });
  });
});

test("la rejilla solo monta las cartas visibles", async ({ page }) => {
  await page.goto("/search?tab=cards&q=t%3Acreature");
  await expect(page.getByTitle("Carta 1-0")).toBeVisible();

  const montadas = await page.locator('a[href^="/cards/"]').count();

  // De 60 cartas solo deben existir en el DOM las de las filas visibles y su margen.
  expect(montadas).toBeGreaterThan(0);
  expect(montadas).toBeLessThan(CARDS_PER_PAGE);
});

test("el scroll carga la página siguiente sin pulsar nada", async ({ page }) => {
  await page.goto("/search?tab=cards&q=t%3Acreature");
  await expect(page.getByTitle("Carta 1-0")).toBeVisible();

  const cargarMas = page.getByRole("button", { name: "Cargar más cartas" });
  await cargarMas.scrollIntoViewIfNeeded();

  // Al llegar la última página ya no hay más que cargar y el botón desaparece.
  await expect(cargarMas).toBeHidden();

  await page.keyboard.press("End");
  await expect(page.getByTitle(`Carta 2-${CARDS_PER_PAGE - 1}`)).toBeVisible();
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
