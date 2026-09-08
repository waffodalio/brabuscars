import { Router } from "express";
import { carModelController } from "../controllers/carModel.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/car-models`
 *   GET    /        list models (optional ?search= &brandId=)  — public
 *   GET    /:id     fetch one model                            — public
 *   POST   /        create a model                             — admin
 *   PUT    /:id     update a model                             — admin
 *   DELETE /:id     delete a model                             — admin
 */
export const carModelRouter = Router();

carModelRouter.get("/", carModelController.list);
carModelRouter.get("/:id", carModelController.get);
carModelRouter.post("/", ...adminOnly, carModelController.create);
carModelRouter.put("/:id", ...adminOnly, carModelController.update);
carModelRouter.delete("/:id", ...adminOnly, carModelController.remove);
