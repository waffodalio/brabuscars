import { describe, expect, it } from "vitest";
import { negotiateLocale } from "./locales";

describe("negotiateLocale", () => {
  it("takes the browser's first supported language", () => {
    expect(negotiateLocale("nl-BE,nl;q=0.9,fr;q=0.8")).toBe("nl");
    expect(negotiateLocale("en-GB")).toBe("en");
  });

  it("skips unsupported languages instead of falling back at once", () => {
    expect(negotiateLocale("de-DE,de;q=0.9,nl;q=0.8,fr;q=0.7")).toBe("nl");
  });

  it("follows the q weights, whatever the order", () => {
    expect(negotiateLocale("fr;q=0.5, nl;q=0.9")).toBe("nl");
    expect(negotiateLocale("nl;q=0, fr")).toBe("fr");
  });

  it("returns null when nothing is supported", () => {
    expect(negotiateLocale("de-DE,es")).toBeNull();
    expect(negotiateLocale("")).toBeNull();
    expect(negotiateLocale(null)).toBeNull();
    expect(negotiateLocale("*")).toBeNull();
  });
});
