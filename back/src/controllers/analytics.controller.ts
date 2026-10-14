import type { Request, Response } from "express";
import {
  analyticsSummaryQuerySchema,
  pageViewSchema,
} from "../dto/analytics.dto";
import { analyticsService } from "../services/analytics.service";
import { success } from "../utils/apiResponse";
import { VISITOR_COOKIE } from "../utils/cookies";

/**
 * HTTP layer for `/api/analytics`. `POST /pageview` is public and always
 * answers 204 (whether or not the view was kept); `GET /summary` is admin-only.
 */
export const analyticsController = {
  async pageView(req: Request, res: Response): Promise<void> {
    const dto = pageViewSchema.parse(req.body);
    const visitorId = req.cookies?.[VISITOR_COOKIE];
    await analyticsService.recordPageView(
      typeof visitorId === "string" ? visitorId : undefined,
      dto,
    );
    res.status(204).send();
  },

  async summary(req: Request, res: Response): Promise<void> {
    const { days } = analyticsSummaryQuerySchema.parse(req.query);
    res.status(200).json(success(await analyticsService.summary(days)));
  },
};
