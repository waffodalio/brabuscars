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
