import { describe, expect, it } from "vitest";
import { normalizeWarranty, uniqueValues } from "./listingWarranty";

describe("normalizeWarranty", () => {
  it("drops everything when there is no warranty length", () => {
    expect(normalizeWarranty({ months: null, kind: "manufacturer", coverage: ["engine"], notes: "x" })).toEqual({
      warrantyMonths: null,
      warrantyKind: null,
      warrantyCoverage: null,
      warrantyCustom: null,
      warrantyNotes: null,
    });
  });

  it("defaults to the dealership's warranty and cleans the lists", () => {
    expect(normalizeWarranty({ months: 12, coverage: ["engine", "gearbox", "engine"], notes: "  " })).toEqual({
      warrantyMonths: 12,
      warrantyKind: "dealer",
      warrantyCoverage: ["engine", "gearbox"],
      warrantyCustom: [],
      warrantyNotes: null,
    });
  });

  it("keeps the chosen type and the conditions", () => {
    expect(normalizeWarranty({ months: 24, kind: "manufacturer", notes: " Jusqu'à 100 000 km " })).toMatchObject({
      warrantyKind: "manufacturer",
      warrantyCoverage: [],
      warrantyNotes: "Jusqu'à 100 000 km",
    });
  });
});

describe("normalizeWarranty — own covered parts", () => {
  it("trims them, drops blanks and duplicates (any case)", () => {
    expect(normalizeWarranty({ months: 12, custom: [" Embrayage ", "", "embrayage", "Boîte de transfert"] }).warrantyCustom).toEqual([
      "Embrayage",
      "Boîte de transfert",
    ]);
  });

  it("drops them with the warranty", () => {
    expect(normalizeWarranty({ months: null, custom: ["Embrayage"] }).warrantyCustom).toBeNull();
  });
});

describe("uniqueValues", () => {
  it("keeps the first occurrence order", () => {
    expect(uniqueValues(["b", "a", "b"])).toEqual(["b", "a"]);
  });
});
