import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.dto";

describe("registerSchema", () => {
  const valid = {
    email: "Jane.Doe@Example.com",
    password: "correcthorsebattery",
    firstName: "Jane",
    lastName: "Doe",
  };

  it("accepts a well-formed registration and lower-cases the email", () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe("jane.doe@example.com");
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: "short1" }),
    ).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      registerSchema.parse({ ...valid, email: "not-an-email" }),
    ).toThrow();
  });

  it("rejects an unknown field (never lets a caller set a role at registration)", () => {
    expect(() =>
      registerSchema.parse({ ...valid, role: "admin" }),
    ).toThrow();
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password (strength is not re-checked at login)", () => {
    expect(() =>
      loginSchema.parse({ email: "a@b.com", password: "x" }),
    ).not.toThrow();
  });

  it("rejects an empty password", () => {
    expect(() =>
      loginSchema.parse({ email: "a@b.com", password: "" }),
    ).toThrow();
  });
});
