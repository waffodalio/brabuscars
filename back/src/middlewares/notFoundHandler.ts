import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Catch-all for unmatched routes. Registered after all routes but before
 * the error handler, which turns this into a 404 JSON response.
 */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
