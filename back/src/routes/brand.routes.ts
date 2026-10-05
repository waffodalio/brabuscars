import { Router } from "express";
import { brandController } from "../controllers/brand.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/brands` — **admin only**. Brands are catalogue reference data managed
 * by administrators; the public never enumerates them, it only sees a brand
 * name through the listing that carries it.
 *
 *   GET    /        list brands (optional ?search=)
 *   GET    /:id     fetch one brand
 *   POST   /        create a brand
 *   PUT    /:id     update a brand
 *   DELETE /:id     delete a brand
 */
export const brandRouter = Router();

brandRouter.use(...adminOnly);

brandRouter.get("/", brandController.list);
brandRouter.get("/:id", brandController.get);
brandRouter.post("/", brandController.create);
brandRouter.put("/:id", brandController.update);
brandRouter.delete("/:id", brandController.remove);
