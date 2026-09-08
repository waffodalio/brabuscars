import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Category } from "@/types/category";

/**
 * Access to the `/categories` endpoints of the backend API. Unwraps the
 * `{ success, data }` envelope and returns the payload.
 */
export const categoryService = {
  async list(search?: string): Promise<Category[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await apiClient.get<ApiSuccess<Category[]>>(
      `/categories${query}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Category> {
    const response = await apiClient.get<ApiSuccess<Category>>(
      `/categories/${id}`,
    );
    return response.data;
  },
};
