"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import type {
  AuthUser,
  Credentials,
  LoginStep,
  MfaEnrollment,
  RegisterInput,
} from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the existing session is being checked on first load. */
  initializing: boolean;
  /** `admin` or `super_admin`. */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Password step; admins then need {@link AuthContextValue.verifyMfa}. */
  login: (credentials: Credentials) => Promise<LoginStep>;
  /** First admin login: fetch the TOTP secret to scan. */
  startMfaEnrollment: () => Promise<MfaEnrollment>;
  /** Second step: opens the session; returns recovery codes on activation. */
  verifyMfa: (code: string) => Promise<string[] | undefined>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // The session cookie (if any) is sent automatically.
    authService
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(
    async (credentials: Credentials): Promise<LoginStep> => {
      const result = await authService.login(credentials);
      if ("mfaRequired" in result) {
        return {
          mfaRequired: true,
          enrollmentRequired: result.enrollmentRequired,
        };
      }
      setUser(result);
      return { mfaRequired: false };
    },
    [],
  );

  const startMfaEnrollment = useCallback(() => authService.mfaSetup(), []);

  const verifyMfa = useCallback(async (code: string) => {
    const { user: verified, recoveryCodes } = await authService.mfaVerify(code);
    setUser(verified);
    return recoveryCodes;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setUser(await authService.register(input));
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAdmin: user?.role === "admin" || user?.role === "super_admin",
      isSuperAdmin: user?.role === "super_admin",
      login,
      startMfaEnrollment,
      verifyMfa,
      register,
      logout,
    }),
    [
      user,
      initializing,
      login,
      startMfaEnrollment,
      verifyMfa,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
