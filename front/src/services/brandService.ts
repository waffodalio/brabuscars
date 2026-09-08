import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Brand } from "@/types/brand";

/**
 * Access to the `/brands` endpoints of the backend API. Unwraps the
 * `{ success, data }` envelope and returns the payload.
 */
export const brandService = {
  async list(search?: string): Promise<Brand[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await apiClient.get<ApiSuccess<Brand[]>>(
      `/brands${query}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Brand> {
    const response = await apiClient.get<ApiSuccess<Brand>>(`/brands/${id}`);
    return response.data;
  },
};
