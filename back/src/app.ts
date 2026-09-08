import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { env, isProduction } from "./config/env";
import { apiRouter } from "./routes";
import { generalRateLimiter } from "./middlewares/rateLimit";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { errorHandler } from "./middlewares/errorHandler";

/**
 * Builds the Express application (security middlewares, routes, error
 * handling). Kept free of any network/database side effects so it can be
 * imported in isolation, e.g. for testing.
 */
export function createApp(): Express {
  const app = express();

  // Never advertise the framework.
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  // Security headers.
  app.use(
    helmet({
      // API only ever returns JSON; keep a tight default CSP anyway.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
      referrerPolicy: { policy: "no-referrer" },
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  // Strict CORS — a single known origin, only the verbs/headers we use.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );

  // Bounded body parsing.
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));

  // Collapse duplicated query/body params (HTTP parameter pollution).
  app.use(hpp());

  // Baseline rate limiting for the whole API.
  app.use(env.API_PREFIX, generalRateLimiter);

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
