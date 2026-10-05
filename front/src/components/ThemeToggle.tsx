"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

/** Animated sun/moon light-dark toggle for the navbar. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  const label = isDark ? t.theme.toLight : t.theme.toDark;

  return (
    <button
      type="button"
      className="chc-theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span key={theme} className="chc-theme-toggle__icon" aria-hidden="true">
        {isDark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 2v2.2" />
              <path d="M12 19.8V22" />
              <path d="M4.2 4.2l1.55 1.55" />
              <path d="M18.25 18.25l1.55 1.55" />
              <path d="M2 12h2.2" />
              <path d="M19.8 12H22" />
              <path d="M4.2 19.8l1.55-1.55" />
              <path d="M18.25 5.75l1.55-1.55" />
            </g>
          </svg>
        )}
      </span>
    </button>
  );
}
