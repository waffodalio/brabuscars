import { rateLimit } from "express-rate-limit";
import { error } from "../utils/apiResponse";
import { isTest } from "../config/env";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Baseline limiter for the whole API — blunt protection against scraping and
 * volumetric abuse. Disabled under NODE_ENV=test so the suite isn't throttled.
 */
export const generalRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: error("Too many requests, please try again later"),
});

/**
 * Strict limiter for credential endpoints (register / login) — slows down
 * brute-force and credential-stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: error("Too many authentication attempts, please try again later"),
});

/**
 * 2FA endpoints (setup / code verification), per IP. Complements the
 * per-account lockout of `mfaService` (5 wrong codes → 15 min).
 */
export const mfaRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: error("Too many attempts, please try again later"),
});

/** Slows down spam through the public contact form. */
export const contactRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTest,
  message: error("Too many messages sent, please try again later"),
});
