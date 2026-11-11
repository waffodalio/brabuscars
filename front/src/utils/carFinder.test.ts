import { describe, expect, it } from "vitest";
import { finderScore, rankListings, type FinderAnswers } from "./carFinder";

const car = (over: Partial<Parameters<typeof finderScore>[0]> = {}) => ({
  price: 13_000,
  transmission: "manual" as const,
  fuelType: "diesel" as const,
  power: 130,
  doors: 5,
  ...over,
});

const answers: FinderAnswers = { budget: "11to15", usage: "family", gearbox: "manual", energy: "diesel" };

describe("finderScore", () => {
  it("gives 100 to a car matching every answer", () => {
    expect(finderScore(car(), answers)).toBe(100);
  });

  it("weighs the budget most", () => {
    expect(finderScore(car({ price: 16_000 }), answers)).toBe(80); // just above: 20 instead of 40
    expect(finderScore(car({ price: 8_000 }), answers)).toBe(90); // cheaper: 30
    expect(finderScore(car({ price: 40_000 }), answers)).toBe(60);
  });

  it("matches the gearbox and the energy, « any » accepting everything", () => {
    expect(finderScore(car({ transmission: "automatic" }), answers)).toBe(80);
    expect(finderScore(car({ transmission: "automatic", fuelType: "petrol" }), { ...answers, gearbox: "any", energy: "any" })).toBe(100);
    expect(finderScore(car({ fuelType: "hybrid" }), { ...answers, energy: "electrified" })).toBe(100);
    expect(finderScore(car({ fuelType: "lpg" }), { ...answers, energy: "petrol" })).toBe(100);
  });

  it("scores the usage from power, doors and energy", () => {
    expect(finderScore(car({ doors: 3 }), answers)).toBe(84);
    expect(finderScore(car({ power: 250 }), { ...answers, usage: "fun" })).toBe(100);
    expect(finderScore(car({ power: 90 }), { ...answers, usage: "fun" })).toBe(84);
    expect(finderScore(car({ power: 90 }), { ...answers, usage: "city" })).toBe(100);
    expect(finderScore(car({ power: 90 }), { ...answers, usage: "travel" })).toBe(92);
  });
});

describe("rankListings", () => {
  it("keeps good matches only, best first, cheapest on a tie", () => {
    const listings = [
      { id: 1, ...car({ price: 14_500 }) },
      { id: 2, ...car({ price: 11_500 }) },
      { id: 3, ...car({ price: 50_000, transmission: "automatic", fuelType: "petrol" }) },
      { id: 4, ...car({ doors: 3 }) },
    ];
    expect(rankListings(listings, answers).map((match) => [match.listing.id, match.score])).toEqual([
      [2, 100],
      [1, 100],
      [4, 84],
    ]);
  });
});
