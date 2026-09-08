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
import { setApiAuthToken } from "@/services/apiClient";
import { authService } from "@/services/authService";
import type { AuthUser, Credentials, RegisterInput } from "@/types/auth";

const TOKEN_STORAGE_KEY = "chcars.token";

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the stored token is being checked on first load. */
  initializing: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* storage unavailable — the token still lives in memory for this session */
  }
  setApiAuthToken(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setInitializing(false);
      return;
    }

    setApiAuthToken(token);
    authService
      .me()
      .then(setUser)
      .catch(() => persistToken(null))
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const { user: nextUser, token } = await authService.login(credentials);
    persistToken(token);
    setUser(nextUser);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: nextUser, token } = await authService.register(input);
    persistToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout],
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
