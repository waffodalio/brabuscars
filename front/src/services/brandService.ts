import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Brand } from "@/types/brand";

export interface BrandInput {
  name: string;
  slug?: string;
}

/**
 * Access to the `/brands` endpoints. Brands are catalogue reference data:
 * every call (reads included) requires an admin token.
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

  async create(input: BrandInput): Promise<Brand> {
    const response = await apiClient.post<ApiSuccess<Brand>>("/brands", input);
    return response.data;
  },

  async update(id: number, input: Partial<BrandInput>): Promise<Brand> {
    const response = await apiClient.put<ApiSuccess<Brand>>(
      `/brands/${id}`,
      input,
    );
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/brands/${id}`);
  },
};
