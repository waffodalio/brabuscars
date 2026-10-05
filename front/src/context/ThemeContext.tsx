"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const COOKIE_NAME = "chcars_theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * `initialTheme` comes from the `chcars_theme` cookie read server-side in
 * the root layout, which also renders it straight onto `<html
 * data-bs-theme>` — so the first client render already matches the
 * server-rendered HTML and hydration never has to reconcile a client-only
 * guess (`localStorage`/`matchMedia` aren't available during SSR, and
 * computing them on the client's first render would disagree with what the
 * server sent).
 */
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-bs-theme", next);
      document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
