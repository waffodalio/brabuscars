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

    const account = page.getByRole("button", { name: /^Mon compte/ });
    await expect(account).toBeVisible();
    await expect(page).toHaveURL(/\/fr\/?$/);

    await account.click();
    await page.getByRole("button", { name: "Déconnexion" }).click();
    await expect(
      page.locator("#main-navbar").getByRole("link", { name: "Connexion" }),
    ).toBeVisible();

    await page.goto("/fr/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("button", { name: /^Mon compte/ })).toBeVisible();
  });

  test("un mauvais mot de passe est refusé", async ({ page }) => {
    await page.goto("/fr/connexion");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill("inconnu@chcars.test");
    await page.getByLabel("Mot de passe", { exact: true }).fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/fr\/connexion/);
  });

  test("« Mon compte » : profil et réservations, sans formulaire de mot de passe", async ({
    page,
  }, testInfo) => {
    const email = `e2e+account-${Date.now()}-${testInfo.project.name}@chcars.test`;

    await page.goto("/fr/inscription");
    await page.getByLabel("Prénom", { exact: true }).fill("E2E");
    await page.getByLabel("Nom", { exact: true }).fill("Account");
    await page.getByLabel("Adresse e-mail", { exact: true }).fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("E2e-password-123");
    await page.getByRole("button", { name: "Créer le compte" }).click();
    await expect(page.getByRole("button", { name: /^Mon compte/ })).toBeVisible();

    await page.goto("/fr/mon-compte");
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mes réservations" })).toBeVisible();
    await expect(page.getByText("Aucune réservation pour le moment.")).toBeVisible();
    // Changing the password goes through "Forgot password?" on the login page.
    await expect(page.getByLabel("Mot de passe actuel")).toHaveCount(0);
  });

  test("mot de passe oublié : réponse identique pour une adresse inconnue", async ({
    page,
  }) => {
    await page.goto("/fr/connexion");
    await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
    await expect(page).toHaveURL(/\/fr\/mot-de-passe-oublie/);
    await page
      .getByLabel("Adresse e-mail", { exact: true })
      .fill(`inconnu-${Date.now()}@chcars.test`);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Si un compte existe avec cette adresse",
    );
  });

  test("un lien de réinitialisation invalide est refusé", async ({ page }) => {
    await page.goto(`/fr/reinitialiser-mot-de-passe?token=${"x".repeat(43)}`);
    await expect(page).not.toHaveURL(/token=/);
    await page.getByLabel("Nouveau mot de passe", { exact: true }).fill("E2e-password-789");
    await page
      .getByLabel("Confirmez le mot de passe", { exact: true })
      .fill("E2e-password-789");
    await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
    await expect(page.getByText(/lien de réinitialisation est invalide/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Demander un nouveau lien" }),
    ).toBeVisible();
  });
});
