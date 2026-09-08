import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type { AuthUser, UserRole } from "@/types/auth";

export interface UserFilters {
  role?: UserRole;
  search?: string;
}

/** Access to `/users` — super admin only. */
export const userService = {
  async list(filters: UserFilters = {}): Promise<AuthUser[]> {
    const params = new URLSearchParams();
    if (filters.role) params.set("role", filters.role);
    if (filters.search) params.set("search", filters.search);
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await apiClient.get<ApiSuccess<AuthUser[]>>(
      `/users${query}`,
    );
    return response.data;
  },

  /** Switch an account between `user` and `admin`. */
  async setRole(
    id: number,
    role: Extract<UserRole, "user" | "admin">,
  ): Promise<AuthUser> {
    const response = await apiClient.patch<ApiSuccess<AuthUser>>(
      `/users/${id}/role`,
      { role },
    );
    return response.data;
  },
};
