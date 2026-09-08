import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { Favorite } from "@/types/favorite";

/** Access to `/favorites`. Every call requires the auth token. */
export const favoriteService = {
  async list(): Promise<Favorite[]> {
    const response = await apiClient.get<ApiSuccess<Favorite[]>>("/favorites");
    return response.data;
  },

  async add(listingId: number): Promise<Favorite> {
    const response = await apiClient.post<ApiSuccess<Favorite>>("/favorites", {
      listingId,
    });
    return response.data;
  },

  async remove(listingId: number): Promise<void> {
    await apiClient.delete<void>(`/favorites/${listingId}`);
  },
};
