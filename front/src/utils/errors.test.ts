import { describe, expect, it } from "vitest";
import { ApiClientError, NETWORK_ERROR_STATUS } from "@/services/apiClient";
import { errorMessage, publicErrorMessage, type ApiErrorMessages } from "./errors";

describe("errorMessage", () => {
  it("returns the Error's own message", () => {
    expect(errorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back for a non-Error rejection (e.g. a thrown string)", () => {
    expect(errorMessage("boom", "fallback")).toBe("fallback");
    expect(errorMessage(undefined, "fallback")).toBe("fallback");
    expect(errorMessage({ code: 500 }, "fallback")).toBe("fallback");
  });

  it("keeps the API message for a client error", () => {
    expect(errorMessage(new ApiClientError("Slug taken", 409), "fallback")).toBe(
      "Slug taken",
    );
  });

  it("replaces network and server failures with a readable message", () => {
    expect(
      errorMessage(new ApiClientError("Network error", NETWORK_ERROR_STATUS), "x"),
    ).toMatch(/injoignable/);
    expect(
      errorMessage(new ApiClientError("Internal server error", 500), "Suppression impossible"),
    ).toMatch(/^Suppression impossible : erreur du serveur/);
  });
});

describe("publicErrorMessage", () => {
  const messages: ApiErrorMessages = {
    network: "network",
    server: "server",
    tooManyRequests: "tooMany",
    sessionExpired: "expired",
    forbidden: "forbidden",
    notFound: "notFound",
    validation: "validation",
  };
  const fail = (status: number) => new ApiClientError("raw API text", status);

  it("never shows the API's raw message", () => {
    for (const status of [NETWORK_ERROR_STATUS, 400, 401, 403, 404, 409, 429, 500, 502]) {
      expect(publicErrorMessage(fail(status), messages, "fallback")).not.toBe(
        "raw API text",
      );
    }
  });

  it("maps statuses to translated messages", () => {
    expect(publicErrorMessage(fail(NETWORK_ERROR_STATUS), messages, "f")).toBe("network");
    expect(publicErrorMessage(fail(400), messages, "f")).toBe("validation");
    expect(publicErrorMessage(fail(401), messages, "f")).toBe("expired");
    expect(publicErrorMessage(fail(404), messages, "f")).toBe("notFound");
    expect(publicErrorMessage(fail(429), messages, "f")).toBe("tooMany");
    expect(publicErrorMessage(fail(503), messages, "f")).toBe("server");
    expect(publicErrorMessage(fail(409), messages, "f")).toBe("f");
  });

  it("lets a form override a status", () => {
    expect(publicErrorMessage(fail(401), messages, "f", { 401: "bad credentials" })).toBe(
      "bad credentials",
    );
  });

  it("falls back for a non-API error", () => {
    expect(publicErrorMessage(new Error("boom"), messages, "f")).toBe("f");
  });
});
