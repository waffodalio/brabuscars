import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/categories`
 *   GET    /        list categories (optional ?search=)  — public
 *   GET    /:id     fetch one category                   — public
 *   POST   /        create a category                    — admin
 *   PUT    /:id     update a category                    — admin
 *   DELETE /:id     delete a category                    — admin
 */
export const categoryRouter = Router();

categoryRouter.get("/", categoryController.list);
categoryRouter.get("/:id", categoryController.get);
categoryRouter.post("/", ...adminOnly, categoryController.create);
categoryRouter.put("/:id", ...adminOnly, categoryController.update);
categoryRouter.delete("/:id", ...adminOnly, categoryController.remove);
