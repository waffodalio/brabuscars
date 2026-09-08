import { Router } from "express";
import { healthRouter } from "./health.routes";
import { companyRouter } from "./company.routes";
import { authRouter } from "./auth.routes";
import { userRouter } from "./user.routes";
import { brandRouter } from "./brand.routes";
import { categoryRouter } from "./category.routes";
import { carModelRouter } from "./carModel.routes";
import { vehicleRouter } from "./vehicle.routes";
import { listingRouter } from "./listing.routes";
import { favoriteRouter } from "./favorite.routes";
import { contactRouter } from "./contact.routes";

/**
 * Root API router. Every resource router is mounted here; the whole tree is
 * mounted under `env.API_PREFIX` (default `/api`) by the Express app.
 */
export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/company", companyRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/brands", brandRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/car-models", carModelRouter);
apiRouter.use("/vehicles", vehicleRouter);
apiRouter.use("/listings", listingRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/contact", contactRouter);
