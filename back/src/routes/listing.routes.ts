import { Router } from "express";
import { listingController } from "../controllers/listing.controller";
import { listingImageRouter } from "./listingImage.routes";
import { adminOnly, optionalAuthenticate } from "../middlewares/authenticate";

/**
 * `/api/listings`
 *   GET    /              list listings (public; ?status= &sellerId= &brandId=
 *                         &fuelType= &transmission= &minPrice= &maxPrice= &search=)
 *                         non-admins only ever see `published` adverts
 *   GET    /:id           fetch one listing (public; non-admins: `published` only)
 *   POST   /              create a listing            — admin
 *   PUT    /:id           update editable fields      — admin
 *   PATCH  /:id/status    change lifecycle status     — admin
 *   DELETE /:id           delete a listing            — admin
 *   .../:listingId/images   image gallery (nested)
 */
export const listingRouter = Router();

listingRouter.get("/", optionalAuthenticate, listingController.list);
listingRouter.get("/:id", optionalAuthenticate, listingController.get);
listingRouter.post("/", ...adminOnly, listingController.create);
listingRouter.put("/:id", ...adminOnly, listingController.update);
listingRouter.patch("/:id/status", ...adminOnly, listingController.updateStatus);
listingRouter.delete("/:id", ...adminOnly, listingController.remove);

listingRouter.use("/:listingId/images", listingImageRouter);
