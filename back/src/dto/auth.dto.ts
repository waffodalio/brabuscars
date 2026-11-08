import { z } from "zod";
import { RESET_TOKEN_PATTERN } from "../utils/passwordReset";

/** Same rule everywhere a password is chosen (register, reset). */
export const newPasswordSchema = z.string().min(8).max(128);

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: newPasswordSchema,
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

/** Front-end locales the Google flow can return to. */
export const FRONT_LOCALES = ["fr", "en", "nl"] as const;

export type FrontLocale = (typeof FRONT_LOCALES)[number];

/** `POST /auth/forgot-password` — `locale` picks the e-mail language and link. */
export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    locale: z.enum(FRONT_LOCALES).default("fr"),
  })
  .strict();

/** `POST /auth/reset-password` — token from the e-mailed link. */
export const resetPasswordSchema = z
  .object({
    token: z.string().regex(RESET_TOKEN_PATTERN),
    password: newPasswordSchema,
    locale: z.enum(FRONT_LOCALES).default("fr"),
  })
  .strict();

/** `GET /auth/google?locale=…` */
export const googleStartQuerySchema = z
  .object({
    locale: z.enum(FRONT_LOCALES).default("fr"),
  })
  .strict();

/**
 * `GET /auth/google/callback` — sent by Google, which appends its own extra
 * parameters (`scope`, `authuser`, `prompt`, `hd`, `iss`…): not `.strict()`,
 * unknown keys are simply dropped.
 */
export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1).max(2048).optional(),
  state: z.string().min(1).max(512).optional(),
  error: z.string().max(200).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
