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

describe("detailed fields (equipment, environment, warranty)", () => {
  const detailed = {
    ...validListing,
    equipment: ["gps", "rearCamera"],
    euroNorm: "euro6d",
    co2: 118,
    hasCarPass: true,
    warrantyMonths: 12,
    warrantyKind: "dealer",
    warrantyCoverage: ["engine", "gearbox"],
    warrantyNotes: "Jusqu'à 150 000 km",
  };

  it("accepts a fully detailed listing", () => {
    expect(() => createListingSchema.parse(detailed)).not.toThrow();
  });

  it("rejects equipment or covered parts outside the lists", () => {
    expect(() => createListingSchema.parse({ ...detailed, equipment: ["jetpack"] })).toThrow();
    expect(() => createListingSchema.parse({ ...detailed, warrantyCoverage: ["tyres"] })).toThrow();
  });

  it("rejects an out-of-range warranty or CO2", () => {
    expect(() => createListingSchema.parse({ ...detailed, warrantyMonths: 0 })).toThrow();
    expect(() => createListingSchema.parse({ ...detailed, warrantyMonths: 121 })).toThrow();
    expect(() => createListingSchema.parse({ ...detailed, co2: 1200 })).toThrow();
  });

  it("lets an update clear the warranty", () => {
    expect(updateListingSchema.parse({ warrantyMonths: null })).toEqual({ warrantyMonths: null });
  });
});

describe("createListingSchema — from a stock vehicle", () => {
  it("accepts the stock vehicle on creation only", () => {
    expect(createListingSchema.parse({ ...validListing, stockVehicleId: 4 }).stockVehicleId).toBe(4);
    expect(() => updateListingSchema.parse({ stockVehicleId: 4 })).toThrow();
  });
});
