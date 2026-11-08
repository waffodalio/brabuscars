import { describe, expect, it } from "vitest";
import { canMoveTo, customerCanCancel, holdEnd, visitSlotProblem } from "./reservationRules";

// Wednesday 2026-11-04, 10:00 in Paris (UTC+1 in winter).
const NOW = new Date("2026-11-04T09:00:00Z");

describe("visitSlotProblem", () => {
  it("accepts a daytime slot a few days ahead", () => {
    expect(visitSlotProblem(new Date("2026-11-06T13:30:00Z"), NOW)).toBeNull(); // 14:30 Paris
  });

  it("needs one hour of notice", () => {
    expect(visitSlotProblem(new Date("2026-11-04T09:30:00Z"), NOW)).toMatch(/advance/);
    expect(visitSlotProblem(new Date("2026-11-03T13:00:00Z"), NOW)).toMatch(/advance/);
  });

  it("refuses slots too far ahead", () => {
    expect(visitSlotProblem(new Date("2027-03-01T10:00:00Z"), NOW)).toMatch(/90 days/);
  });

  it("reads the opening hours in Paris time", () => {
    expect(visitSlotProblem(new Date("2026-11-06T06:30:00Z"), NOW)).toMatch(/between/); // 07:30
    expect(visitSlotProblem(new Date("2026-11-06T07:00:00Z"), NOW)).toBeNull(); // 08:00
    expect(visitSlotProblem(new Date("2026-11-06T18:59:00Z"), NOW)).toBeNull(); // 19:59
    expect(visitSlotProblem(new Date("2026-11-06T19:00:00Z"), NOW)).toMatch(/between/); // 20:00
  });

  it("rejects an invalid date", () => {
    expect(visitSlotProblem(new Date("nope"), NOW)).toMatch(/Invalid/);
  });
});

describe("transitions", () => {
  it("lets the back-office settle a pending request", () => {
    expect(canMoveTo("pending", "confirmed")).toBe(true);
    expect(canMoveTo("pending", "declined")).toBe(true);
    expect(canMoveTo("confirmed", "cancelled")).toBe(true);
  });

  it("refuses to reopen a settled request", () => {
    expect(canMoveTo("declined", "confirmed")).toBe(false);
    expect(canMoveTo("cancelled", "pending")).toBe(false);
    expect(canMoveTo("confirmed", "declined")).toBe(false);
  });

  it("lets the customer withdraw an open request only", () => {
    expect(customerCanCancel("pending")).toBe(true);
    expect(customerCanCancel("confirmed")).toBe(true);
    expect(customerCanCancel("declined")).toBe(false);
    expect(customerCanCancel("cancelled")).toBe(false);
  });
});

describe("holdEnd", () => {
  it("adds whole days", () => {
    expect(holdEnd(7, NOW).toISOString()).toBe("2026-11-11T09:00:00.000Z");
  });
});
