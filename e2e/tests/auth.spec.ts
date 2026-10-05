import { expect, test } from "@playwright/test";

/**
 * Full account lifecycle for a throwaway `user`. Each run creates one account
 * (`e2e+<timestamp>@chcars.test`) on the target environment — run against
 * preprod, never against production.
 */
test.describe("Authentification", () => {
  test.describe.configure({ mode: "serial" });

  test("inscription, déconnexion puis reconnexion", async ({
    page,
  }, testInfo) => {
    const email = `e2e+${Date.now()}-${testInfo.project.name}@chcars.test`;
    const password = "E2e-password-123";

    await page.goto("/fr/inscription");
    await page.getByLabel("Prénom", { exact: true }).fill("E2E");
    await page.getByLabel("Nom", { exact: true }).fill("Playwright");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Créer le compte" }).click();

    const logout = page.getByRole("button", { name: "Déconnexion" });
    await expect(logout).toBeVisible();
    await expect(page).toHaveURL(/\/fr\/?$/);

    await logout.click();
    await expect(
      page.locator("#main-navbar").getByRole("link", { name: "Connexion" }),
    ).toBeVisible();

    await page.goto("/fr/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("button", { name: "Déconnexion" })).toBeVisible();
  });

  test("un mauvais mot de passe est refusé", async ({ page }) => {
    await page.goto("/fr/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill("inconnu@chcars.test");
    await page.getByLabel("Mot de passe", { exact: true }).fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/fr\/connexion/);
  });
});
