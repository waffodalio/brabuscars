import { Router } from "express";
import { contactController } from "../controllers/contact.controller";
import { adminOnly } from "../middlewares/authenticate";
import { contactRateLimiter } from "../middlewares/rateLimit";

/**
 * `/api/contact`
 *   POST   /        send a message (public, rate limited)
 *   GET    /        list messages          — admin
 *   PATCH  /:id     toggle « handled »     — admin
 *   DELETE /:id     delete a message       — admin
 */
export const contactRouter = Router();

contactRouter.post("/", contactRateLimiter, contactController.submit);
contactRouter.get("/", ...adminOnly, contactController.list);
contactRouter.patch("/:id", ...adminOnly, contactController.update);
contactRouter.delete("/:id", ...adminOnly, contactController.remove);
