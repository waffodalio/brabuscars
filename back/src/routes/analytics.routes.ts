import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { adminOnly } from "../middlewares/authenticate";
import { analyticsRateLimiter } from "../middlewares/rateLimit";

/**
 * `/api/analytics`
 *   POST /pageview   record a page view (public; kept only with the consent
 *                    cookie `chcars_visitor_id`; own rate limit, CSRF-exempt)
 *   GET  /summary    ?days=7|30|90 — audience, engagement and catalogue report — admin
 */
export const analyticsRouter = Router();

analyticsRouter.post("/pageview", analyticsRateLimiter, analyticsController.pageView);
analyticsRouter.get("/summary", ...adminOnly, analyticsController.summary);
