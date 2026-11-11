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
