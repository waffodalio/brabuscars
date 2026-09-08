import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { CarModel } from "@/types/carModel";

export interface CarModelFilters {
  search?: string;
  brandId?: number;
}

/**
 * Access to the `/car-models` endpoints of the backend API. Unwraps the
 * `{ success, data }` envelope and returns the payload.
 */
export const carModelService = {
  async list(filters: CarModelFilters = {}): Promise<CarModel[]> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.brandId) params.set("brandId", String(filters.brandId));
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await apiClient.get<ApiSuccess<CarModel[]>>(
      `/car-models${query}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<CarModel> {
    const response = await apiClient.get<ApiSuccess<CarModel>>(
      `/car-models/${id}`,
    );
    return response.data;
  },
};
