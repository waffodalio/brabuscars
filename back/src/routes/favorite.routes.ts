import { Router } from "express";
import { favoriteController } from "../controllers/favorite.controller";
import { authenticate } from "../middlewares/authenticate";

/**
 * `/api/favorites` — all routes require a valid bearer token and operate on
 * the calling user's favourites.
 *
 *   GET    /              list my favourites (with the embedded listing)
 *   POST   /              add a favourite         body { listingId }
 *   DELETE /:listingId    remove a favourite
 */
export const favoriteRouter = Router();

favoriteRouter.use(authenticate);

favoriteRouter.get("/", favoriteController.list);
favoriteRouter.post("/", favoriteController.add);
favoriteRouter.delete("/:listingId", favoriteController.remove);
