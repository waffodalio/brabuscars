import { describe, expect, it } from "vitest";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl } from "./mapLinks";

const company = {
  address: "12 avenue de l'Automobile",
  postalCode: "69003",
  city: "Lyon",
  country: "France",
};

describe("googleMapsEmbedUrl", () => {
  it("URL-encodes the full postal address as the query", () => {
    const url = googleMapsEmbedUrl(company);
    expect(url).toContain(
      encodeURIComponent("12 avenue de l'Automobile, 69003 Lyon, France"),
    );
  });

  it("points at the key-free legacy embed endpoint", () => {
    expect(googleMapsEmbedUrl(company)).toMatch(
      /^https:\/\/www\.google\.com\/maps\?q=.+&output=embed$/,
    );
  });
});

describe("googleMapsDirectionsUrl", () => {
  it("uses the documented key-free Maps URLs API", () => {
    const url = googleMapsDirectionsUrl(company);
    expect(url).toMatch(
      /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=.+$/,
    );
  });

  it("URL-encodes the destination address", () => {
    const url = googleMapsDirectionsUrl(company);
    expect(url).toContain(
      encodeURIComponent("12 avenue de l'Automobile, 69003 Lyon, France"),
    );
  });
});
