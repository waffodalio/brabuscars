import multer from "multer";
import type { RequestHandler } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
});

const MAX_MB = Math.round(env.MAX_UPLOAD_BYTES / (1024 * 1024));

/**
 * Parses one `file` field from a `multipart/form-data` body into
 * `req.file`. Multer errors are converted to `ApiError` for the central
 * error handler.
 */
export const uploadSingleImage: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      next(
        err.code === "LIMIT_FILE_SIZE"
          ? ApiError.badRequest(`Image trop lourde (max ${MAX_MB} Mo)`)
          : ApiError.badRequest(`Envoi invalide : ${err.message}`),
      );
      return;
    }
    next(err);
  });
};
