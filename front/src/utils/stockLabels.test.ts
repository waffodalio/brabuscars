import { describe, expect, it } from "vitest";
import { isInGarage, listingStatusBlock, stockMatches } from "./stockLabels";

const vehicle = {
  reference: "STK-0007",
  label: "Audi A4 2.0 TDI S line",
  vin: "WAUZZZF40MA012345",
  year: 2021,
  supplier: "Garage Dupont",
  location: "Parc A",
  color: "Gris",
  listing: { id: 3, title: "Audi A4 Avant", status: "published" as const, price: 24990 },
};

describe("stockMatches", () => {
  it("finds a car by reference (any format), model, VIN, year, supplier or listing", () => {
    for (const query of ["stk-0007", "STK 0007", "audi a4", "s line", "012345", "2021", "dupont", "parc a", "avant", ""]) {
      expect(stockMatches(vehicle, query)).toBe(true);
    }
  });

  it("needs every word", () => {
    expect(stockMatches(vehicle, "audi bmw")).toBe(false);
  });
});

describe("isInGarage", () => {
  it("is true until the car leaves", () => {
    expect(isInGarage("incoming")).toBe(true);
    expect(isInGarage("preparation")).toBe(true);
    expect(isInGarage("sold")).toBe(false);
    expect(isInGarage("exited")).toBe(false);
  });
});

describe("listingStatusBlock", () => {
  it("mirrors the API rule", () => {
    expect(listingStatusBlock({ current: "draft", next: "published", vehicleStatus: "in_stock", invoiced: false })).toBeNull();
    expect(listingStatusBlock({ current: "draft", next: "published", vehicleStatus: null, invoiced: false })).toBeNull();
    expect(listingStatusBlock({ current: "archived", next: "published", vehicleStatus: "exited", invoiced: false })).toMatch(/sorti/);
    expect(listingStatusBlock({ current: "sold", next: "published", vehicleStatus: "sold", invoiced: false })).toBeNull();
    expect(listingStatusBlock({ current: "sold", next: "published", vehicleStatus: "sold", invoiced: true })).toMatch(/facturé/);
    expect(listingStatusBlock({ current: "published", next: "archived", vehicleStatus: "exited", invoiced: false })).toBeNull();
  });
});
