import { describe, expect, it } from "vitest";
import { hasRole } from "./authenticate";

describe("hasRole", () => {
  it("lets a role satisfy its own minimum", () => {
    expect(hasRole("admin", "admin")).toBe(true);
  });

  it("lets a higher-ranked role satisfy a lower minimum (super_admin passes admin-only gates)", () => {
    expect(hasRole("super_admin", "admin")).toBe(true);
  });

  it("rejects a lower-ranked role", () => {
    expect(hasRole("user", "admin")).toBe(false);
    expect(hasRole("admin", "super_admin")).toBe(false);
  });

  it("rejects an anonymous caller (no role)", () => {
    expect(hasRole(undefined, "user")).toBe(false);
  });
});
