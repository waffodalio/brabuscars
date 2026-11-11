import { describe, expect, it } from "vitest";
import { daysInStock, exitStatus, stockReference, stockTotals, todayInBrussels } from "./stockRules";

describe("stockReference", () => {
  it("pads the id", () => {
    expect(stockReference(7)).toBe("STK-0007");
    expect(stockReference(12345)).toBe("STK-12345");
  });
});

describe("stockTotals", () => {
  it("adds the costs to the purchase price, in cents", () => {
    expect(stockTotals(15000, [{ amount: 0.1 }, { amount: 0.2 }, { amount: 450 }], 19990)).toEqual({
      costs: 450.3,
      costPrice: 15450.3,
      potentialMargin: 4539.7,
    });
  });

  it("leaves unknown figures null", () => {
    expect(stockTotals(null, [{ amount: 100 }], 19990)).toEqual({ costs: 100, costPrice: null, potentialMargin: null });
    expect(stockTotals(10000, [], null)).toEqual({ costs: 0, costPrice: 10000, potentialMargin: null });
  });
});

describe("daysInStock", () => {
  it("counts until the exit, else until today", () => {
    expect(daysInStock("2026-11-01", "2026-11-11", "2026-12-31")).toBe(10);
    expect(daysInStock("2026-11-01", null, "2026-11-11")).toBe(10);
    expect(daysInStock("2026-11-11", null, "2026-11-01")).toBe(0);
  });
});

describe("exitStatus", () => {
  it("is sold for a sale, exited otherwise", () => {
    expect(exitStatus("sale")).toBe("sold");
    expect(exitStatus("return")).toBe("exited");
    expect(exitStatus("scrap")).toBe("exited");
  });
});

describe("todayInBrussels", () => {
  it("uses the Brussels calendar day", () => {
    expect(todayInBrussels(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
});
