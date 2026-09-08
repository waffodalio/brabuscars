import { Router } from "express";
import { brandController } from "../controllers/brand.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/brands`
 *   GET    /        list brands (optional ?search=)   — public
 *   GET    /:id     fetch one brand                   — public
 *   POST   /        create a brand                    — admin
 *   PUT    /:id     update a brand                    — admin
 *   DELETE /:id     delete a brand                    — admin
 */
export const brandRouter = Router();

brandRouter.get("/", brandController.list);
brandRouter.get("/:id", brandController.get);
brandRouter.post("/", ...adminOnly, brandController.create);
brandRouter.put("/:id", ...adminOnly, brandController.update);
brandRouter.delete("/:id", ...adminOnly, brandController.remove);
