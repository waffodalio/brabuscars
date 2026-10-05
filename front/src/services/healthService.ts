import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";

export interface HealthStatus {
  status: "ok";
  database: "connected" | "disconnected";
  timestamp: string;
}

/** Access to `/health` — API liveness and database connection. */
export const healthService = {
  async get(): Promise<HealthStatus> {
    const response = await apiClient.get<ApiSuccess<HealthStatus>>("/health");
    return response.data;
  },
};
