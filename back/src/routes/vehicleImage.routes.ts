import { Router } from "express";
import { vehicleImageController } from "../controllers/vehicleImage.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * Nested under `/api/vehicles/:vehicleId/images` (mergeParams keeps
 * `:vehicleId` visible here).
 *
 *   GET    /              list a vehicle's images (public, ordered by position)
 *   POST   /              add an image                              — admin
 *   PATCH  /:imageId      update an image                           — admin
 *   DELETE /:imageId      remove an image                           — admin
 */
export const vehicleImageRouter = Router({ mergeParams: true });

vehicleImageRouter.get("/", vehicleImageController.list);
vehicleImageRouter.post("/", ...adminOnly, vehicleImageController.create);
vehicleImageRouter.patch("/:imageId", ...adminOnly, vehicleImageController.update);
vehicleImageRouter.delete(
  "/:imageId",
  ...adminOnly,
  vehicleImageController.remove,
);
