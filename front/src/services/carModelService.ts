import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { CarModel } from "@/types/carModel";

export interface CarModelFilters {
  search?: string;
  brandId?: number;
}

export interface CarModelInput {
  name: string;
  brandId: number;
}

/**
 * Access to the `/car-models` endpoints. Models are catalogue reference data:
 * every call (reads included) requires an admin token.
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

  async create(input: CarModelInput): Promise<CarModel> {
    const response = await apiClient.post<ApiSuccess<CarModel>>(
      "/car-models",
      input,
    );
    return response.data;
  },

  async update(id: number, input: Partial<CarModelInput>): Promise<CarModel> {
    const response = await apiClient.put<ApiSuccess<CarModel>>(
      `/car-models/${id}`,
      input,
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/car-models/${id}`);
  },
};
