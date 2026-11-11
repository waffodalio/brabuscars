import { describe, expect, it } from "vitest";
import { similarListings, similarityScore } from "./similarListings";

const car = (id: number, over: Record<string, unknown> = {}) =>
  ({
    id,
    price: 20_000,
    fuelType: "diesel",
    categoryId: 1,
    status: "published",
    model: { id: 1, name: "A4", brandId: 1, brand: { id: 1, name: "Audi" } },
    ...over,
  }) as never;

describe("similarityScore", () => {
  it("adds brand, category, close price and fuel", () => {
    expect(similarityScore(car(1), car(2))).toBe(8);
    expect(
      similarityScore(car(1), car(2, { model: { brand: { id: 2 } }, categoryId: 3, price: 40_000, fuelType: "petrol" })),
    ).toBe(0);
  });
});

describe("similarListings", () => {
  it("keeps close published listings, best first, never the listing itself", () => {
    const base = car(1);
    const all = [
      base,
      car(2, { price: 24_000 }), // 8
      car(3, { model: { brand: { id: 2 } }, price: 21_000 }), // 5
      car(4, { status: "sold" }),
      car(5, { model: { brand: { id: 2 } }, categoryId: 9, price: 50_000, fuelType: "petrol" }), // 0
      car(6, { price: 19_500 }), // 8, closer price than #2
    ];
    expect(similarListings(base, all).map((listing: { id: number }) => listing.id)).toEqual([6, 2, 3]);
  });
});
