import { Router } from "express";
import { listingImageController } from "../controllers/listingImage.controller";
import { adminOnly } from "../middlewares/authenticate";
import { uploadSingleImage } from "../middlewares/upload";

/**
 * Nested under `/api/listings/:listingId/images` (mergeParams keeps
 * `:listingId` visible here).
 *
 *   GET    /              list a listing's images (public, ordered by position)
 *   POST   /              upload an image (multipart, field « file »)   — admin
 *   PATCH  /:imageId      update position / cover                       — admin
 *   DELETE /:imageId      remove an image (file + row)                  — admin
 */
export const listingImageRouter = Router({ mergeParams: true });

listingImageRouter.get("/", listingImageController.list);
listingImageRouter.post(
  "/",
  ...adminOnly,
  uploadSingleImage,
  listingImageController.add,
);
listingImageRouter.patch(
  "/:imageId",
  ...adminOnly,
  listingImageController.update,
);
listingImageRouter.delete(
  "/:imageId",
  ...adminOnly,
  listingImageController.remove,
);
