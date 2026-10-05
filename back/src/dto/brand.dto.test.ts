import { describe, expect, it } from "vitest";
import { createBrandSchema } from "./brand.dto";

describe("createBrandSchema", () => {
  it("accepts a name with no explicit slug (derived server-side)", () => {
    expect(() => createBrandSchema.parse({ name: "Peugeot" })).not.toThrow();
  });

  it("accepts an explicit kebab-case slug", () => {
    expect(() =>
      createBrandSchema.parse({ name: "Peugeot", slug: "peugeot" }),
    ).not.toThrow();
  });

  it("rejects a slug with uppercase letters", () => {
    expect(() =>
      createBrandSchema.parse({ name: "Peugeot", slug: "Peugeot" }),
    ).toThrow();
  });

  it("rejects a slug with spaces or underscores", () => {
    expect(() =>
      createBrandSchema.parse({ name: "Peugeot", slug: "peugeot cars" }),
    ).toThrow();
    expect(() =>
      createBrandSchema.parse({ name: "Peugeot", slug: "peugeot_cars" }),
    ).toThrow();
  });

  it("rejects an empty name", () => {
    expect(() => createBrandSchema.parse({ name: "" })).toThrow();
  });
});
