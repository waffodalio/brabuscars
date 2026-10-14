import { describe, expect, it } from "vitest";
import { LISTING_STATUSES } from "../entities/Listing";
import { isPublished } from "./listingVisibility";

describe("isPublished", () => {
  it("accepts a published listing", () => {
    expect(isPublished({ status: "published" })).toBe(true);
  });

  it("rejects every other status", () => {
    for (const status of LISTING_STATUSES.filter((s) => s !== "published")) {
      expect(isPublished({ status })).toBe(false);
    }
  });
});
