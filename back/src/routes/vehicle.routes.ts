import { Router } from "express";
import { vehicleController } from "../controllers/vehicle.controller";
import { vehicleImageRouter } from "./vehicleImage.routes";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/vehicles`
 *   GET    /        list vehicles (optional ?modelId= &categoryId= &brandId=
 *                   &fuelType= &transmission=)                  — public
 *   GET    /:id     fetch one vehicle (model, brand, category, images) — public
 *   POST   /        create a vehicle                            — admin
 *   PUT    /:id     update a vehicle                            — admin
 *   DELETE /:id     delete a vehicle                            — admin
 */
export const vehicleRouter = Router();

vehicleRouter.get("/", vehicleController.list);
vehicleRouter.get("/:id", vehicleController.get);
vehicleRouter.post("/", ...adminOnly, vehicleController.create);
vehicleRouter.put("/:id", ...adminOnly, vehicleController.update);
vehicleRouter.delete("/:id", ...adminOnly, vehicleController.remove);

vehicleRouter.use("/:vehicleId/images", vehicleImageRouter);
