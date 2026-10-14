import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { AnalyticsPeriod, AnalyticsSummary } from "@/types/analytics";

/** `trackPageView` is public (kept only with the consent cookie); `summary` is admin-only. */
export const analyticsService = {
  async trackPageView(path: string): Promise<void> {
    await apiClient.post<void>("/analytics/pageview", { path });
  },

  async summary(days: AnalyticsPeriod): Promise<AnalyticsSummary> {
    const response = await apiClient.get<ApiSuccess<AnalyticsSummary>>(
      `/analytics/summary?days=${days}`,
    );
    return response.data;
  },
};
