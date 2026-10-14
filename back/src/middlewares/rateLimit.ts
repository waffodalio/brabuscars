import { rateLimit, type Options } from "express-rate-limit";
import { error } from "../utils/apiResponse";
import { isTest } from "../config/env";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Logs every rejection before answering 429: throttled visitors otherwise
 * leave no trace in the API logs (a too-low limit shows up as « listings
 * cannot be loaded » on the site and nothing else).
 */
const logAndReject: Options["handler"] = (req, res, _next, options) => {
  console.warn(
    `[rate-limit] 429 ${req.ip ?? "?"} ${req.method} ${req.originalUrl} (limit ${String(options.limit)})`,
  );
  res.status(options.statusCode).json(options.message);
};

/** Has its own limiter: page views must not eat the browsing budget. */
const PAGE_VIEW_PATH = "/analytics/pageview";

/**
 * Baseline limiter for the whole API — blunt protection against scraping and
 * volumetric abuse. Sized for real browsing: one page view costs several
 * calls (session, company, favourites, listings…) and many visitors can share
 * one IP (office, mobile carrier NAT) — 300 was hit in normal use. The
 * sensitive endpoints keep their own strict limiters below. Disabled under
 * NODE_ENV=test so the suite isn't throttled.
 */
export const generalRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: logAndReject,
  skip: (req) => isTest || req.path === PAGE_VIEW_PATH,
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
  handler: logAndReject,
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
  handler: logAndReject,
  skip: () => isTest,
  message: error("Too many attempts, please try again later"),
});

/**
 * "Sign in with Google" (start + callback), per IP. Separate from the
 * password limiter so a Google round trip doesn't eat the login budget.
 */
export const oauthRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: logAndReject,
  skip: () => isTest,
  message: error("Too many sign-in attempts, please try again later"),
});

/** Slows down spam through the public contact form. */
export const contactRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: logAndReject,
  skip: () => isTest,
  message: error("Too many messages sent, please try again later"),
});

/**
 * Audience-measurement beacons, per IP: one per page displayed. Generous
 * enough for real browsing, low enough to stop anyone inflating the figures.
 */
export const analyticsRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: logAndReject,
  skip: () => isTest,
  message: error("Too many requests, please try again later"),
});
