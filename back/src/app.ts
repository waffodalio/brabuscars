import path from "node:path";
import express, { type Express, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { env, isProduction } from "./config/env";
import { apiRouter } from "./routes";
import { generalRateLimiter } from "./middlewares/rateLimit";
import { ensureCsrfCookie, verifyCsrf } from "./middlewares/csrf";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { errorHandler } from "./middlewares/errorHandler";

/** Path segment under which uploaded images are served (e.g. `/uploads`). */
const UPLOADS_ROUTE = new URL(env.PUBLIC_UPLOADS_URL).pathname || "/uploads";

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

  // Strict CORS — a single known origin, credentials enabled for the auth
  // cookie, only the verbs/headers we use.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
      maxAge: 600,
    }),
  );

  // Uploaded images — long-cached, embeddable anywhere, never executed.
  // In production a reverse proxy (Nginx / CDN) should serve this directory.
  app.use(
    UPLOADS_ROUTE,
    express.static(path.resolve(env.UPLOAD_DIR), {
      index: false,
      immutable: true,
      maxAge: "365d",
      setHeaders: (res: Response) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Content-Disposition", "inline");
      },
    }),
  );

  app.use(cookieParser());

  // Bounded body parsing (multipart is handled by multer on upload routes).
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));

  // Collapse duplicated query/body params (HTTP parameter pollution).
  app.use(hpp());

  // API-scoped protections.
  app.use(env.API_PREFIX, generalRateLimiter);
  app.use(env.API_PREFIX, ensureCsrfCookie);
  app.use(env.API_PREFIX, verifyCsrf);

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
