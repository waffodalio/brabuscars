import { Router } from "express";
import { stockVehicleController } from "../controllers/stockVehicle.controller";
import { adminOnly } from "../middlewares/authenticate";
import { uploadSingleImage } from "../middlewares/upload";

/**
 * `/api/stock` — the garage register (cars managed by the dealership,
 * independent from the listings), admin only.
 *   GET    /?status=                 cars (latest entries first)
 *   POST   /                         enter a car
 *   GET    /:id                      one car (costs, figures, its sale files)
 *   PUT    /:id                      update a car
 *   DELETE /:id                      delete an entry (never a car on a sale file)
 *   POST   /:id/exit                 the car leaves (sale, return, scrap…)
 *   POST   /:id/reopen               back in stock
 *   POST   /:id/costs                add a cost (repairs, inspection…)
 *   DELETE /:id/costs/:costId        remove a cost
 *   GET    /:id/images               the car's photos (shown on its listing)
 *   POST   /:id/images               upload a photo (multipart, field « file »)
 *   PATCH  /:id/images/:imageId      position / cover
 *   DELETE /:id/images/:imageId      remove a photo (file + row)
 */
export const stockVehicleRouter = Router();

stockVehicleRouter.use(...adminOnly);
stockVehicleRouter.get("/", stockVehicleController.list);
stockVehicleRouter.post("/", stockVehicleController.create);
stockVehicleRouter.get("/:id", stockVehicleController.get);
stockVehicleRouter.put("/:id", stockVehicleController.update);
stockVehicleRouter.delete("/:id", stockVehicleController.remove);
stockVehicleRouter.post("/:id/exit", stockVehicleController.exit);
stockVehicleRouter.post("/:id/reopen", stockVehicleController.reopen);
stockVehicleRouter.post("/:id/costs", stockVehicleController.addCost);
stockVehicleRouter.delete("/:id/costs/:costId", stockVehicleController.removeCost);
stockVehicleRouter.get("/:id/images", stockVehicleController.listImages);
stockVehicleRouter.post("/:id/images", uploadSingleImage, stockVehicleController.addImage);
stockVehicleRouter.patch("/:id/images/:imageId", stockVehicleController.updateImage);
stockVehicleRouter.delete("/:id/images/:imageId", stockVehicleController.removeImage);
