import { Router } from "express";
import { carModelController } from "../controllers/carModel.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/car-models` — **admin only**. Models are catalogue reference data
 * managed by administrators; the public only sees a model name through the
 * listing that carries it.
 *
 *   GET    /        list models (optional ?search= &brandId=)
 *   GET    /:id     fetch one model
 *   POST   /        create a model
 *   PUT    /:id     update a model
 *   DELETE /:id     delete a model
 */
export const carModelRouter = Router();

carModelRouter.use(...adminOnly);

carModelRouter.get("/", carModelController.list);
carModelRouter.get("/:id", carModelController.get);
carModelRouter.post("/", carModelController.create);
carModelRouter.put("/:id", carModelController.update);
carModelRouter.delete("/:id", carModelController.remove);
