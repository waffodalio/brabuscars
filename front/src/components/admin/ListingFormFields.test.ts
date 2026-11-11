import { describe, expect, it } from "vitest";
import { EMPTY_LISTING_FORM, toListingPayload } from "./ListingFormFields";

const filled = {
  ...EMPTY_LISTING_FORM,
  modelId: "3",
  title: "Peugeot 208 GT Line",
  price: "12000",
  year: "2021",
  mileage: "30000",
};

describe("toListingPayload", () => {
  it("converts a well-formed form to a typed payload", () => {
    const payload = toListingPayload(filled);
    expect(payload).toMatchObject({
      modelId: 3,
      price: 12000,
      year: 2021,
      mileage: 30000,
    });
  });

  it("throws when no model is selected", () => {
    expect(() => toListingPayload({ ...filled, modelId: "" })).toThrow();
  });

  it("throws when the price is zero or negative", () => {
    expect(() => toListingPayload({ ...filled, price: "0" })).toThrow();
    expect(() => toListingPayload({ ...filled, price: "-100" })).toThrow();
  });

  it("throws when the year is blank", () => {
    expect(() => toListingPayload({ ...filled, year: "" })).toThrow();
  });

  it("throws when the mileage is not a number", () => {
    expect(() => toListingPayload({ ...filled, mileage: "" })).toThrow();
  });

  it("maps blank optional fields to null rather than empty strings", () => {
    const payload = toListingPayload({
      ...filled,
      categoryId: "",
      power: "",
      doors: "",
      color: "",
      description: "",
    });
    expect(payload.categoryId).toBeNull();
    expect(payload.power).toBeNull();
    expect(payload.doors).toBeNull();
    expect(payload.color).toBeNull();
    expect(payload.description).toBeNull();
  });
});

describe("toListingPayload — details", () => {
  it("sends no warranty fields when the warranty is off", () => {
    const payload = toListingPayload({
      ...filled,
      warranty: false,
      warrantyMonths: "24",
      warrantyCoverage: ["engine"],
      warrantyCustom: ["Embrayage"],
      warrantyNotes: "x",
    });
    expect(payload).toMatchObject({
      warrantyMonths: null,
      warrantyKind: null,
      warrantyCoverage: [],
      warrantyCustom: [],
      warrantyNotes: null,
    });
  });

  it("sends the warranty, equipment and environment as typed values", () => {
    const payload = toListingPayload({
      ...filled,
      equipment: ["gps"],
      euroNorm: "euro6d",
      co2: "118",
      hasCarPass: true,
      warranty: true,
      warrantyMonths: "12",
      warrantyKind: "manufacturer",
      warrantyCoverage: ["engine", "gearbox"],
      warrantyCustom: ["Embrayage"],
      warrantyNotes: "  150 000 km max  ",
    });
    expect(payload).toMatchObject({
      equipment: ["gps"],
      euroNorm: "euro6d",
      co2: 118,
      hasCarPass: true,
      warrantyMonths: 12,
      warrantyKind: "manufacturer",
      warrantyCoverage: ["engine", "gearbox"],
      warrantyCustom: ["Embrayage"],
      warrantyNotes: "150 000 km max",
    });
  });

  it("rejects an invalid CO2 or warranty length", () => {
    expect(() => toListingPayload({ ...filled, co2: "12.5" })).toThrow();
    expect(() => toListingPayload({ ...filled, warranty: true, warrantyMonths: "0" })).toThrow();
    expect(() => toListingPayload({ ...filled, warranty: true, warrantyMonths: "200" })).toThrow();
  });

  it("leaves blank environment fields empty", () => {
    expect(toListingPayload(filled)).toMatchObject({ euroNorm: null, co2: null, hasCarPass: false });
  });
});
