import { describe, expect, it } from "vitest";
import { listingIdFromParam, listingPath, pageKey, slugify } from "./listingPath";

describe("listingPath", () => {
  it("puts the id first, then the title in plain words", () => {
    expect(listingPath({ id: 5, title: "Mercedes-Benz GLC 300e « AMG Line »" })).toBe(
      "/annonces/5-mercedes-benz-glc-300e-amg-line",
    );
    expect(listingPath({ id: 7, title: "Citroën C5 Aircross — été 2024 !" })).toBe(
      "/annonces/7-citroen-c5-aircross-ete-2024",
    );
  });

  it("falls back to the bare id when the title has no letters or digits", () => {
    expect(listingPath({ id: 9, title: "« — »" })).toBe("/annonces/9");
  });

  it("keeps the words short and never ends on a dash", () => {
    const slug = slugify("a".repeat(70) + " bbbbbbbbbbbbbbbbbbbb");
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("listingIdFromParam", () => {
  it("reads the leading id, with or without words", () => {
    expect(listingIdFromParam("5-mercedes-benz-glc")).toBe(5);
    expect(listingIdFromParam("12")).toBe(12);
  });

  it("rejects anything else", () => {
    expect(listingIdFromParam("mercedes-5")).toBeNull();
    expect(listingIdFromParam("5abc")).toBeNull();
    expect(listingIdFromParam("")).toBeNull();
  });
});

describe("pageKey", () => {
  it("ignores the words of a listing address", () => {
    expect(pageKey("/fr/annonces/5-mercedes")).toBe("/fr/annonces/5");
    expect(pageKey("/fr/annonces/5")).toBe("/fr/annonces/5");
    expect(pageKey("/fr/annonces")).toBe("/fr/annonces");
  });
});
