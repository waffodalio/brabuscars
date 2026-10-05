import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, hasInvalidRange, toQuery } from "./listingFilters";

describe("toQuery", () => {
  it("turns blank fields into undefined instead of NaN or empty strings", () => {
    const query = toQuery(EMPTY_FILTERS);
    expect(query.minPrice).toBeUndefined();
    expect(query.maxPrice).toBeUndefined();
    expect(query.search).toBeUndefined();
  });

  it("coerces filled numeric fields to numbers", () => {
    const query = toQuery({
      ...EMPTY_FILTERS,
      minPrice: "5000",
      maxYear: "2020",
    });
    expect(query.minPrice).toBe(5000);
    expect(query.maxYear).toBe(2020);
  });

  it("always scopes the public listings page to published adverts", () => {
    expect(toQuery(EMPTY_FILTERS).status).toBe("published");
  });
});

describe("hasInvalidRange", () => {
  it("is false when no bound is set", () => {
    expect(hasInvalidRange(toQuery(EMPTY_FILTERS))).toBe(false);
  });

  it("is false when only one side of a range is set", () => {
    expect(
      hasInvalidRange(toQuery({ ...EMPTY_FILTERS, minPrice: "5000" })),
    ).toBe(false);
  });

  it("is false when min equals max", () => {
    expect(
      hasInvalidRange(
        toQuery({ ...EMPTY_FILTERS, minPrice: "5000", maxPrice: "5000" }),
      ),
    ).toBe(false);
  });

  it("is true when minPrice is greater than maxPrice", () => {
    expect(
      hasInvalidRange(
        toQuery({ ...EMPTY_FILTERS, minPrice: "20000", maxPrice: "10000" }),
      ),
    ).toBe(true);
  });

  it("is true when minYear is greater than maxYear", () => {
    expect(
      hasInvalidRange(
        toQuery({ ...EMPTY_FILTERS, minYear: "2022", maxYear: "2015" }),
      ),
    ).toBe(true);
  });

  it("checks price and year independently", () => {
    // A valid price range must not hide an invalid year range.
    expect(
      hasInvalidRange(
        toQuery({
          ...EMPTY_FILTERS,
          minPrice: "5000",
          maxPrice: "10000",
          minYear: "2022",
          maxYear: "2015",
        }),
      ),
    ).toBe(true);
  });
});
