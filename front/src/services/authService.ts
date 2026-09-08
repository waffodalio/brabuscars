import { apiClient } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type {
  AuthResult,
  AuthUser,
  Credentials,
  RegisterInput,
} from "@/types/auth";

/**
 * Access to the `/auth` endpoints. `register` and `login` return the user and
 * a JWT; `me` reads the current user (requires the token to be set on the
 * API client).
 */
export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const response = await apiClient.post<ApiSuccess<AuthResult>>(
      "/auth/register",
      input,
    );
    return response.data;
  },

  async login(credentials: Credentials): Promise<AuthResult> {
    const response = await apiClient.post<ApiSuccess<AuthResult>>(
      "/auth/login",
      credentials,
    );
    return response.data;
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<ApiSuccess<AuthUser>>("/auth/me");
    return response.data;
  },
};
