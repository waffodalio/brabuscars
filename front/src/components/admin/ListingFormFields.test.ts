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
