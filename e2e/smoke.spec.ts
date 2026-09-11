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

test("la biblioteca muestra el estado vacío", async ({ page }) => {
  await page.goto("/decks");

  await expect(page.getByRole("heading", { name: "Mis mazos", level: 1 })).toBeVisible();
  await expect(page.getByText("Aún no tienes mazos")).toBeVisible();
});

test("la navegación principal lleva de los mazos a la búsqueda", async ({ page }) => {
  await page.goto("/decks");
  await page.getByRole("link", { name: "Buscar" }).click();

  await expect(page).toHaveURL(/\/search/);
  await expect(page.getByRole("heading", { name: "Buscar", level: 1 })).toBeVisible();
});

test("una búsqueda sin resultados lo dice claramente", async ({ page }) => {
  await page.goto("/search?tab=cards");
  await page.getByLabel("Buscar cartas").fill("t:creature");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page.getByText("Sin resultados")).toBeVisible();
});
