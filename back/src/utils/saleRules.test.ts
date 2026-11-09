import { describe, expect, it } from "vitest";
import {
  afterPayment,
  canDeletePayment,
  documentFilename,
  documentNumber,
  isEditable,
  paymentProblem,
  totalCents,
  vatBreakdown,
} from "./saleRules";

describe("totals", () => {
  it("adds the lines in cents (no floating-point drift)", () => {
    expect(totalCents([{ quantity: 1, unitPrice: 0.1 }, { quantity: 2, unitPrice: 0.2 }])).toBe(50);
    expect(totalCents([{ quantity: 1, unitPrice: 24990 }, { quantity: 1, unitPrice: 349.9 }])).toBe(2533990);
  });

  it("shows no VAT under the margin scheme", () => {
    expect(vatBreakdown(2420000, "margin")).toEqual({ netCents: 2420000, vatCents: 0, totalCents: 2420000 });
  });

  it("splits 21 % VAT out of a VAT-inclusive total", () => {
    expect(vatBreakdown(2420000, "standard")).toEqual({ netCents: 2000000, vatCents: 420000, totalCents: 2420000 });
    const odd = vatBreakdown(1001, "standard");
    expect(odd.netCents + odd.vatCents).toBe(1001);
  });
});

describe("documentNumber", () => {
  it("prefixes by kind and pads the sequence", () => {
    expect(documentNumber("order", 2026, 1)).toBe("BC-2026-0001");
    expect(documentNumber("invoice", 2026, 42)).toBe("F-2026-0042");
    expect(documentNumber("invoice", 2027, 12345)).toBe("F-2027-12345");
  });
});

describe("documentFilename", () => {
  it("names the file after the number, the vehicle and the buyer", () => {
    expect(documentFilename("F-2026-0001", "Audi A4 Avant — 2021 — 42 000 km", "Alice Martin")).toBe(
      "F-2026-0001_audi-a4-avant_alice-martin.pdf",
    );
    expect(documentFilename("BC-2026-0002", "Citroën C5 Aircross « Shine »", "Élodie D'Hondt")).toBe(
      "BC-2026-0002_citroen-c5-aircross-shine_elodie-d-hondt.pdf",
    );
  });

  it("keeps it short and skips what is missing", () => {
    const name = documentFilename("F-2026-0003", "x".repeat(80), "y".repeat(80));
    expect(name).toBe(`F-2026-0003_${"x".repeat(40)}_${"y".repeat(30)}.pdf`);
    expect(documentFilename("F-2026-0004", undefined, "Bob")).toBe("F-2026-0004_bob.pdf");
  });
});

describe("afterPayment", () => {
  it("issues the purchase order on an advance", () => {
    expect(afterPayment("draft", 10000, 3000)).toEqual({ status: "ordered", issue: "order" });
  });

  it("issues nothing on a further partial payment", () => {
    expect(afterPayment("ordered", 10000, 6000)).toEqual({ status: "ordered", issue: null });
  });

  it("issues the invoice once everything is paid", () => {
    expect(afterPayment("ordered", 10000, 10000)).toEqual({ status: "paid", issue: "invoice" });
  });

  it("goes straight to the invoice when paid in full at once", () => {
    expect(afterPayment("draft", 10000, 10000)).toEqual({ status: "paid", issue: "invoice" });
  });
});

describe("paymentProblem", () => {
  it("accepts a payment within the amount due", () => {
    expect(paymentProblem("draft", 10000, 0, 2500)).toBeNull();
    expect(paymentProblem("ordered", 10000, 2500, 7500)).toBeNull();
  });

  it("refuses overpayment, empty sales, non-positive amounts and paid sales", () => {
    expect(paymentProblem("ordered", 10000, 2500, 8000)).toMatch(/exceeds/);
    expect(paymentProblem("draft", 0, 0, 100)).toMatch(/line/);
    expect(paymentProblem("draft", 10000, 0, 0)).toMatch(/positive/);
    expect(paymentProblem("paid", 10000, 10000, 1)).toMatch(/fully paid/);
  });
});

describe("locks", () => {
  it("freezes payments tied to a document and everything once paid", () => {
    expect(canDeletePayment("ordered", null)).toBe(true);
    expect(canDeletePayment("ordered", 3)).toBe(false);
    expect(canDeletePayment("paid", null)).toBe(false);
  });

  it("only lets a draft be edited", () => {
    expect(isEditable("draft")).toBe(true);
    expect(isEditable("ordered")).toBe(false);
    expect(isEditable("paid")).toBe(false);
  });
});
