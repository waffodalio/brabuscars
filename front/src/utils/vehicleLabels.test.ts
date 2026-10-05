import { describe, expect, it } from "vitest";
import { vehicleTitle } from "./vehicleLabels";

describe("vehicleTitle", () => {
  it("combines brand and model when the relation is loaded", () => {
    expect(
      vehicleTitle({
        modelId: 1,
        model: {
          id: 1,
          name: "208",
          brandId: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
          brand: {
            id: 1,
            name: "Peugeot",
            slug: "peugeot",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        },
      }),
    ).toBe("Peugeot 208");
  });

  it("falls back to just the model name when the brand is missing", () => {
    expect(
      vehicleTitle({
        modelId: 1,
        model: {
          id: 1,
          name: "208",
          brandId: 1,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      }),
    ).toBe("208");
  });

  it("falls back to a placeholder when the model relation isn't loaded", () => {
    expect(vehicleTitle({ modelId: 7 })).toBe("Modèle #7");
  });
});
