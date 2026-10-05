import { expect, test } from "@playwright/test";

test.describe("Pages publiques", () => {
  test("la racine redirige vers la locale française", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/fr\/?$/);
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });

  test("la page des annonces se charge", async ({ page }) => {
    await page.goto("/fr/annonces");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("la page contact affiche les coordonnées de la concession", async ({
    page,
    request,
  }) => {
    const company = (await (await request.get("/api/company")).json()).data;
    await page.goto("/fr/contact");
    await expect(page.locator("address")).toContainText(company.address);
  });

  test("l'espace admin n'est pas accessible aux visiteurs", async ({ page }) => {
    await page.goto("/fr/admin");
    await expect(page).toHaveURL(/\/fr\/connexion/);
  });
});
