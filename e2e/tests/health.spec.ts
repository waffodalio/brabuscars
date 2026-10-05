import { expect, test } from "@playwright/test";

test.describe("API", () => {
  test("health reports the database as connected", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({
      success: true,
      data: { status: "ok", database: "connected" },
    });
  });

  test("catalogue referentials are not exposed to visitors", async ({
    request,
  }) => {
    for (const path of ["/api/brands", "/api/categories", "/api/car-models"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(401);
    }
  });
});
