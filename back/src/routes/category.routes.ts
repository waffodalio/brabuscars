import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/categories` — **admin only**. Categories are catalogue reference data
 * managed by administrators; the public only sees a category name through the
 * listing that carries it.
 *
 *   GET    /        list categories (optional ?search=)
 *   GET    /:id     fetch one category
 *   POST   /        create a category
 *   PUT    /:id     update a category
 *   DELETE /:id     delete a category
 */
export const categoryRouter = Router();

categoryRouter.use(...adminOnly);

categoryRouter.get("/", categoryController.list);
categoryRouter.get("/:id", categoryController.get);
categoryRouter.post("/", categoryController.create);
categoryRouter.put("/:id", categoryController.update);
categoryRouter.delete("/:id", categoryController.remove);
