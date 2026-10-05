import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Category } from "@/types/category";

export interface CategoryInput {
  name: string;
  slug?: string;
}

/**
 * Access to the `/categories` endpoints. Categories are catalogue reference
 * data: every call (reads included) requires an admin token.
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

  async create(input: CategoryInput): Promise<Category> {
    const response = await apiClient.post<ApiSuccess<Category>>(
      "/categories",
      input,
    );
    return response.data;
  },

  async update(id: number, input: Partial<CategoryInput>): Promise<Category> {
    const response = await apiClient.put<ApiSuccess<Category>>(
      `/categories/${id}`,
      input,
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/categories/${id}`);
  },
};
