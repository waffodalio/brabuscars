import { describe, expect, it } from "vitest";
import { stockGaps } from "./stockGaps";

const vehicle = {
  modelId: 1,
  label: "Audi A4 2.0 TDI",
  year: 2021,
  mileage: 42_000,
  fuelType: "diesel" as const,
  transmission: "automatic" as const,
  power: 150,
  doors: 5,
  color: "Gris",
};
const listing = { ...vehicle, model: { id: 1, name: "A4", brandId: 1, createdAt: "", brand: { id: 1, name: "Audi", slug: "audi", createdAt: "" } } };

describe("stockGaps", () => {
  it("finds nothing when the listing matches the car", () => {
    expect(stockGaps(vehicle, { ...listing, color: " gris ", mileage: 43_500 })).toEqual([]);
  });

  it("lists every disagreement", () => {
    const gaps = stockGaps(vehicle, { ...listing, modelId: 2, year: 2020, mileage: 30_000, fuelType: "petrol", transmission: "manual", power: 110 });
    expect(gaps.map((gap) => gap.label)).toEqual(["Modèle", "Année", "Kilométrage", "Carburant", "Boîte", "Puissance"]);
  });

  it("ignores fields left blank on either side", () => {
    expect(stockGaps({ ...vehicle, power: null, color: null }, { ...listing, power: 300, doors: null, color: "Rouge" })).toEqual([]);
  });
});
