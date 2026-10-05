import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lower-cases and dashes plain words", () => {
    expect(slugify("Peugeot")).toBe("peugeot");
    expect(slugify("Grand Cherokee")).toBe("grand-cherokee");
  });

  it("strips accents", () => {
    expect(slugify("Citroën")).toBe("citroen");
    expect(slugify("Berline élégante")).toBe("berline-elegante");
  });

  it("collapses runs of non-alphanumeric characters into a single dash", () => {
    expect(slugify("4x4 / SUV !!")).toBe("4x4-suv");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  -Peugeot-  ")).toBe("peugeot");
  });
});
