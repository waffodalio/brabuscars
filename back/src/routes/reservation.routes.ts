import { Router } from "express";
import { reservationController } from "../controllers/reservation.controller";
import { adminOnly, authenticate } from "../middlewares/authenticate";
import { reservationRateLimiter } from "../middlewares/rateLimit";

/**
 * `/api/reservations`
 *   POST   /                 put a car aside or book a visit — signed-in
 *                            customer (rate limited)
 *   GET    /mine             the signed-in customer's requests
 *   POST   /:id/cancel       the customer withdraws one of their requests
 *   GET    /?status=&type=   all requests — admin
 *   PATCH  /:id              confirm / decline / cancel — admin
 *   DELETE /:id              delete — admin
 */
export const reservationRouter = Router();

reservationRouter.post("/", reservationRateLimiter, authenticate, reservationController.create);
reservationRouter.get("/mine", authenticate, reservationController.mine);
reservationRouter.post("/:id/cancel", authenticate, reservationController.cancelMine);
reservationRouter.get("/", ...adminOnly, reservationController.list);
reservationRouter.patch("/:id", ...adminOnly, reservationController.decide);
reservationRouter.delete("/:id", ...adminOnly, reservationController.remove);
