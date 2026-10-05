import { describe, expect, it } from "vitest";
import {
  createListingSchema,
  listListingQuerySchema,
  updateListingSchema,
} from "./listing.dto";

const validListing = {
  modelId: 1,
  title: "Peugeot 208 GT Line",
  price: 12000,
  year: 2021,
  mileage: 30000,
  fuelType: "petrol",
  transmission: "manual",
};

describe("listListingQuerySchema", () => {
  it("accepts a query with no range filters", () => {
    expect(listListingQuerySchema.parse({}).sort).toBe("recent");
  });

  it("accepts minPrice <= maxPrice", () => {
    expect(() =>
      listListingQuerySchema.parse({ minPrice: "5000", maxPrice: "10000" }),
    ).not.toThrow();
  });

  it("accepts minPrice === maxPrice", () => {
    expect(() =>
      listListingQuerySchema.parse({ minPrice: "5000", maxPrice: "5000" }),
    ).not.toThrow();
  });

  it("rejects minPrice > maxPrice", () => {
    expect(() =>
      listListingQuerySchema.parse({ minPrice: "10000", maxPrice: "5000" }),
    ).toThrow();
  });

  it("rejects minYear > maxYear", () => {
    expect(() =>
      listListingQuerySchema.parse({ minYear: "2022", maxYear: "2018" }),
    ).toThrow();
  });

  it("does not flag a range where only one bound is set", () => {
    expect(() => listListingQuerySchema.parse({ minPrice: "5000" })).not.toThrow();
    expect(() => listListingQuerySchema.parse({ maxYear: "2020" })).not.toThrow();
  });
});

describe("createListingSchema", () => {
  it("accepts a well-formed listing", () => {
    expect(() => createListingSchema.parse(validListing)).not.toThrow();
  });

  it("rejects a non-positive price", () => {
    expect(() =>
      createListingSchema.parse({ ...validListing, price: 0 }),
    ).toThrow();
  });

  it("rejects an unknown field (schema is .strict())", () => {
    expect(() =>
      createListingSchema.parse({ ...validListing, extra: "nope" }),
    ).toThrow();
  });

  it("rejects a year far in the future", () => {
    expect(() =>
      createListingSchema.parse({
        ...validListing,
        year: new Date().getFullYear() + 5,
      }),
    ).toThrow();
  });
});

describe("updateListingSchema", () => {
  it("rejects an empty patch", () => {
    expect(() => updateListingSchema.parse({})).toThrow();
  });

  it("accepts a single-field patch", () => {
    expect(() => updateListingSchema.parse({ price: 9999 })).not.toThrow();
  });
});
