import { expect, test } from "@playwright/test";

/**
 * Pruebas de humo de los recorridos principales.
 *
 * Las llamadas a nuestros Route Handlers se interceptan en el navegador: así el test
 * no depende de Scryfall ni de la red, y comprueba lo que nos interesa, que es la interfaz.
 */
test.beforeEach(async ({ page }) => {
  await page.route("**/api/cards/search**", (route) =>
    route.fulfill({ json: { items: [], totalCount: 0, hasMore: false, page: 1 } }),
  );
  await page.route("**/api/cards/autocomplete**", (route) => route.fulfill({ json: [] }));
});

test("sin sesión, la biblioteca lleva a iniciar sesión y recuerda a dónde ibas", async ({
  page,
}) => {
  await page.goto("/decks");

  await expect(page).toHaveURL(/\/login\?next=%2Fdecks/);
  await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
});

test("la vista de un mazo no exige sesión: los mazos públicos se comparten", async ({ page }) => {
  const response = await page.goto("/decks/cualquier-id");

  // No hay API en esta prueba, así que el mazo no carga, pero lo importante es que el
  // proxy NO ha mandado a iniciar sesión.
  expect(response?.url()).not.toContain("/login");
});

test("la navegación principal lleva a la búsqueda", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Buscar", exact: true }).click();

  await expect(page).toHaveURL(/\/search/);
  await expect(page.getByRole("heading", { name: "Buscar", level: 1 })).toBeVisible();
});

test("una búsqueda sin resultados lo dice claramente", async ({ page }) => {
  await page.goto("/search?tab=cards");
  await page.getByLabel("Buscar cartas").fill("t:creature");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page.getByText("Sin resultados")).toBeVisible();
});
