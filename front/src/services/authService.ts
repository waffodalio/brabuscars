import { apiClient, setCsrfToken } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type {
  AuthResult,
  AuthUser,
  Credentials,
  RegisterInput,
} from "@/types/auth";

/**
 * Access to the `/auth` endpoints. The JWT is handled by the browser as an
 * httpOnly cookie; these methods only deal with the user object and the CSRF
 * token.
 */
export const authService = {
  async register(input: RegisterInput): Promise<AuthUser> {
    const response = await apiClient.post<ApiSuccess<AuthResult>>(
      "/auth/register",
      input,
    );
    setCsrfToken(response.data.csrfToken);
    return response.data.user;
  },

  async login(credentials: Credentials): Promise<AuthUser> {
    const response = await apiClient.post<ApiSuccess<AuthResult>>(
      "/auth/login",
      credentials,
    );
    setCsrfToken(response.data.csrfToken);
    return response.data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>("/auth/logout");
    } finally {
      setCsrfToken(null);
    }
  },

  async me(): Promise<AuthUser> {
    const response = await apiClient.get<ApiSuccess<AuthUser>>("/auth/me");
    return response.data;
  },
};
