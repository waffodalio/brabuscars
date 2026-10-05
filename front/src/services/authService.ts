import { apiClient, setCsrfToken } from "./apiClient";
import type { ApiSuccess } from "@/types/api";
import type {
  AuthResult,
  AuthUser,
  Credentials,
  MfaChallenge,
  MfaEnrollment,
  MfaVerifyResult,
  RegisterInput,
} from "@/types/auth";

/**
 * Access to the `/auth` endpoints. The JWT is handled by the browser as an
 * httpOnly cookie; these methods only deal with the user object and the CSRF
 * token. Admin logins go through a second step (`/auth/mfa/*`), authorized by
 * a short-lived httpOnly cookie set at the password step.
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

  /** Returns the user, or the 2FA challenge for accounts that need it. */
  async login(credentials: Credentials): Promise<AuthUser | MfaChallenge> {
    const response = await apiClient.post<
      ApiSuccess<AuthResult | MfaChallenge>
    >("/auth/login", credentials);
    if ("mfaRequired" in response.data) return response.data;
    setCsrfToken(response.data.csrfToken);
    return response.data.user;
  },

  async mfaSetup(): Promise<MfaEnrollment> {
    const response =
      await apiClient.post<ApiSuccess<MfaEnrollment>>("/auth/mfa/setup");
    return response.data;
  },

  async mfaVerify(
    code: string,
  ): Promise<{ user: AuthUser; recoveryCodes?: string[] }> {
    const response = await apiClient.post<ApiSuccess<MfaVerifyResult>>(
      "/auth/mfa/verify",
      { code },
    );
    setCsrfToken(response.data.csrfToken);
    return {
      user: response.data.user,
      recoveryCodes: response.data.recoveryCodes,
    };
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
