import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(8).max(128),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
  })
  .strict();

/** 6-digit TOTP code or `XXXXX-XXXXX` recovery code. */
export const mfaVerifySchema = z
  .object({
    code: z.string().trim().min(6).max(20),
  })
  .strict();

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
