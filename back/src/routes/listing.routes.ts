import { Router } from "express";
import { listingController } from "../controllers/listing.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/listings`
 *   GET    /              list listings (public; ?status= &sellerId= &brandId=
 *                         &fuelType= &transmission= &minPrice= &maxPrice= &search=)
 *   GET    /:id           fetch one listing (public)
 *   POST   /              create a listing            — admin
 *   PUT    /:id           update editable fields      — admin
 *   PATCH  /:id/status    change lifecycle status     — admin
 *   DELETE /:id           delete a listing            — admin
 */
export const listingRouter = Router();

listingRouter.get("/", listingController.list);
listingRouter.get("/:id", listingController.get);
listingRouter.post("/", ...adminOnly, listingController.create);
listingRouter.put("/:id", ...adminOnly, listingController.update);
listingRouter.patch("/:id/status", ...adminOnly, listingController.updateStatus);
listingRouter.delete("/:id", ...adminOnly, listingController.remove);
