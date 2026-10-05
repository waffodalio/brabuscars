import { describe, expect, it } from "vitest";
import { escapeLike } from "./escapeLike";

describe("escapeLike", () => {
  it("leaves ordinary text untouched", () => {
    expect(escapeLike("Peugeot 208")).toBe("Peugeot 208");
  });

  it("escapes the % and _ LIKE metacharacters", () => {
    expect(escapeLike("100%_electric")).toBe("100\\%\\_electric");
  });

  it("escapes a literal backslash so it can't unescape the pattern", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("neutralises a wildcard search attempt", () => {
    // Without escaping, "%" would turn a search box into a match-everything scan.
    expect(escapeLike("%")).toBe("\\%");
  });
});
