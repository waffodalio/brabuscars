import { describe, expect, it } from "vitest";
import { saleReference } from "./saleLabels";

describe("saleReference", () => {
  it("prefers the invoice, then the purchase order, else none (draft)", () => {
    expect(saleReference({ documents: [] })).toBeNull();
    expect(saleReference({ documents: [{ kind: "order", number: "BC-2026-0003" }] })).toBe("BC-2026-0003");
    expect(
      saleReference({
        documents: [
          { kind: "order", number: "BC-2026-0003" },
          { kind: "invoice", number: "F-2026-0007" },
        ],
      }),
    ).toBe("F-2026-0007");
  });
});

import { saleMatches, salesByListing } from "./saleLabels";

const sale = {
  documents: [{ number: "BC-2026-0003" }, { number: "F-2026-0007" }],
  buyer: { name: "Élodie D'Hondt", company: "Hondt SRL", email: "elodie@example.com", phone: "+32 470 00 00 00", vatNumber: "BE0123456789" },
  lines: [{ description: "Audi A4 Avant — 2021 — 42 000 km" }],
  listing: { id: 5, title: "Audi A4 Avant 2.0 TDI" },
  vehicleVin: "WAUZZZF40MA012345",
};

describe("saleMatches", () => {
  it("finds a sale by document number, buyer, vehicle, listing or VIN, accents ignored", () => {
    for (const query of ["F-2026-0007", "bc-2026-0003", "elodie", "hondt srl", "a4 avant", "2.0 tdi", "012345", ""]) {
      expect(saleMatches(sale, query)).toBe(true);
    }
  });

  it("needs every word", () => {
    expect(saleMatches(sale, "audi bmw")).toBe(false);
    expect(saleMatches(sale, "F-2026-0008")).toBe(false);
  });
});

describe("salesByListing", () => {
  it("groups the sale files by listing, skipping those without one", () => {
    const map = salesByListing([
      { id: 1, listing: { id: 5 } },
      { id: 2, listing: null },
      { id: 3, listing: { id: 5 } },
    ]);
    expect(map.get(5)?.map((item) => item.id)).toEqual([1, 3]);
    expect(map.size).toBe(1);
  });
});

import { documentRegister, documentYear } from "./saleLabels";

describe("documentRegister", () => {
  const doc = (id: number, kind: "order" | "invoice", number: string) => ({
    id,
    kind,
    number,
    filename: `${number}.pdf`,
    issuedAt: "2026-03-01T10:00:00.000Z",
    total: 1000,
    paid: 1000,
  });
  const sales = [
    { id: 1, documents: [doc(1, "order", "BC-2026-0001"), doc(2, "invoice", "F-2026-0002")] },
    { id: 2, documents: [doc(3, "order", "BC-2026-0002")] },
    { id: 3, documents: [doc(4, "invoice", "F-2026-0001")] },
    { id: 4, documents: [] },
    { id: 5, documents: [doc(5, "invoice", "F-2025-0040")] },
  ];

  it("lists invoices only, most recent number first", () => {
    expect(documentRegister(sales, "invoice").map((entry) => entry.document.number)).toEqual([
      "F-2026-0002",
      "F-2026-0001",
      "F-2025-0040",
    ]);
  });

  it("gives each invoice the purchase order it settles, if any", () => {
    expect(documentRegister(sales, "invoice").map((entry) => [entry.document.number, entry.orderNumber])).toEqual([
      ["F-2026-0002", "BC-2026-0001"],
      ["F-2026-0001", null],
      ["F-2025-0040", null],
    ]);
  });

  it("lists purchase orders with the invoice that followed, if any", () => {
    expect(
      documentRegister(sales, "order").map((entry) => [entry.document.number, entry.invoiceNumber, entry.sale.id]),
    ).toEqual([
      ["BC-2026-0002", null, 2],
      ["BC-2026-0001", "F-2026-0002", 1],
    ]);
  });
});

describe("documentYear", () => {
  it("uses the Brussels calendar (New Year's Eve late evening UTC is already next year)", () => {
    expect(documentYear("2026-12-31T23:30:00.000Z")).toBe(2027);
    expect(documentYear("2026-06-15T10:00:00.000Z")).toBe(2026);
  });
});

import { documentMonth, monthLabel } from "./saleLabels";

describe("documentMonth / monthLabel", () => {
  it("files a document under its Brussels month", () => {
    expect(documentMonth("2026-10-31T23:30:00.000Z")).toBe("2026-11");
    expect(monthLabel("2026-11")).toBe("novembre 2026");
  });
});
