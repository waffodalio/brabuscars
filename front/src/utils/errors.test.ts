import { describe, expect, it } from "vitest";
import { errorMessage } from "./errors";

describe("errorMessage", () => {
  it("returns the Error's own message", () => {
    expect(errorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for a non-Error rejection (e.g. a thrown string)", () => {
    expect(errorMessage("boom", "fallback")).toBe("fallback");
    expect(errorMessage(undefined, "fallback")).toBe("fallback");
    expect(errorMessage({ code: 500 }, "fallback")).toBe("fallback");
  });
});
