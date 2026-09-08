import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { error } from "../utils/apiResponse";
import { isProduction } from "../config/env";

/** Reads a numeric HTTP status set by Express / body-parser on an error. */
function statusOf(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const candidate =
      (err as { status?: unknown }).status ??
      (err as { statusCode?: unknown }).statusCode;
    if (
      typeof candidate === "number" &&
      candidate >= 400 &&
      candidate <= 599
    ) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Central error handler. Must be registered last, after all routes.
 * Converts known error types into the standard error envelope and never
 * leaks internal details or stack traces to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(error(err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = err.flatten();
    const details =
      formErrors.length > 0
        ? { ...fieldErrors, _errors: formErrors }
        : fieldErrors;
    res.status(400).json(error("Validation failed", details));
    return;
  }

  // Errors raised by Express / body-parser (malformed JSON → 400,
  // payload too large → 413, …). Return the status but a generic message.
  const libStatus = statusOf(err);
  if (libStatus && libStatus < 500) {
    res
      .status(libStatus)
      .json(error(libStatus === 413 ? "Payload too large" : "Bad request"));
    return;
  }

  const message = err instanceof Error ? err.message : "Unexpected error";
  console.error("[errorHandler]", err);

  res
    .status(500)
    .json(error(isProduction ? "Internal server error" : message));
};
