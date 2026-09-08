import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { error } from "../utils/apiResponse";
import { isProduction } from "../config/env";

/**
 * Central error handler. Must be registered last, after all routes.
 * Converts known error types into the standard error envelope and
 * hides internal details in production.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(error(err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = err.flatten();
    const details =
      formErrors.length > 0 ? { ...fieldErrors, _errors: formErrors } : fieldErrors;
    res.status(400).json(error("Validation failed", details));
    return;
  }

  const message =
    err instanceof Error ? err.message : "Unexpected error";
  console.error("[errorHandler]", err);

  res
    .status(500)
    .json(error(isProduction ? "Internal server error" : message));
};
