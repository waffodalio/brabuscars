import { describe, expect, it } from "vitest";
import {
  isInGarage,
  listingStatusAfterExit,
  listingStatusAfterReopen,
  listingStatusProblem,
  reopensVehicle,
} from "./stockListingRules";

describe("listingStatusAfterExit", () => {
  it("sells the listing on a sale, archives it otherwise", () => {
    expect(listingStatusAfterExit("sale")).toBe("sold");
    for (const reason of ["return", "scrap", "transfer", "other"] as const) {
      expect(listingStatusAfterExit(reason)).toBe("archived");
    }
  });
});

describe("listingStatusAfterReopen", () => {
  it("puts a closed listing back online if it had been published, else in draft", () => {
    expect(listingStatusAfterReopen("sold", true)).toBe("published");
    expect(listingStatusAfterReopen("archived", true)).toBe("published");
    expect(listingStatusAfterReopen("archived", false)).toBe("draft");
  });

  it("leaves an open listing alone", () => {
    expect(listingStatusAfterReopen("published", true)).toBeNull();
    expect(listingStatusAfterReopen("draft", false)).toBeNull();
  });
});

describe("listingStatusProblem", () => {
  const base = { current: "draft" as const, next: "published" as const, vehicleStatus: "in_stock" as const, invoiced: false };

  it("lets a listing without car, or with a car at the garage, change freely", () => {
    expect(listingStatusProblem({ ...base, vehicleStatus: null })).toBeNull();
    expect(listingStatusProblem(base)).toBeNull();
    expect(listingStatusProblem({ ...base, vehicleStatus: "preparation" })).toBeNull();
    expect(listingStatusProblem({ ...base, vehicleStatus: "incoming" })).toBeNull();
  });

  it("refuses publishing when the car left the garage", () => {
    expect(listingStatusProblem({ ...base, vehicleStatus: "exited" })).toMatch(/left the garage/);
    expect(listingStatusProblem({ ...base, current: "archived", vehicleStatus: "sold" })).toMatch(/left the garage/);
  });

  it("allows un-selling a car sold by hand, not an invoiced one", () => {
    expect(listingStatusProblem({ ...base, current: "sold", vehicleStatus: "sold" })).toBeNull();
    expect(listingStatusProblem({ ...base, current: "sold", vehicleStatus: "sold", invoiced: true })).toMatch(/invoiced/);
    expect(listingStatusProblem({ ...base, current: "sold", next: "draft", vehicleStatus: null, invoiced: true })).toMatch(/invoiced/);
  });

  it("always allows archiving or marking sold", () => {
    expect(listingStatusProblem({ ...base, next: "archived", vehicleStatus: "exited" })).toBeNull();
    expect(listingStatusProblem({ ...base, current: "published", next: "sold", vehicleStatus: "in_stock" })).toBeNull();
  });
});

describe("reopensVehicle", () => {
  it("is true only when un-selling a car sold by hand", () => {
    expect(reopensVehicle({ current: "sold", next: "published", vehicleStatus: "sold", invoiced: false })).toBe(true);
    expect(reopensVehicle({ current: "sold", next: "draft", vehicleStatus: "sold", invoiced: false })).toBe(true);
    expect(reopensVehicle({ current: "sold", next: "published", vehicleStatus: "sold", invoiced: true })).toBe(false);
    expect(reopensVehicle({ current: "sold", next: "archived", vehicleStatus: "sold", invoiced: false })).toBe(false);
    expect(reopensVehicle({ current: "published", next: "sold", vehicleStatus: "in_stock", invoiced: false })).toBe(false);
  });
});

describe("isInGarage", () => {
  it("covers incoming, in stock and preparation", () => {
    expect(["incoming", "in_stock", "preparation", "sold", "exited"].map((status) => isInGarage(status as never))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });
});
