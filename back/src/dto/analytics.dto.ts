import { z } from "zod";

/** Body of `POST /analytics/pageview`: the front-end pathname only (no query string). */
export const pageViewSchema = z
  .object({
    path: z
      .string()
      .max(255)
      .regex(/^\/[A-Za-z0-9\-._~/]*$/, "must be a plain pathname"),
  })
  .strict();

export const ANALYTICS_PERIODS = [7, 30, 90] as const;

export const analyticsSummaryQuerySchema = z
  .object({
    days: z.coerce
      .number()
      .int()
      .refine(
        (value) => (ANALYTICS_PERIODS as readonly number[]).includes(value),
        { message: `days must be one of ${ANALYTICS_PERIODS.join(", ")}` },
      )
      .default(30),
  })
  .strict();

export type PageViewDto = z.infer<typeof pageViewSchema>;
export type AnalyticsSummaryQuery = z.infer<typeof analyticsSummaryQuerySchema>;
