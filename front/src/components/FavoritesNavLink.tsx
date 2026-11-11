"use client";

import Link from "next/link";
import { useFavorites } from "@/context/FavoritesContext";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Star in the navbar (signed-in users) leading to « Mes favoris », with the
 * number of favourites; the counter pops each time it changes.
 */
export function FavoritesNavLink() {
  const { favorites } = useFavorites();
  const { t, withLocale } = useLanguage();
  const count = favorites.length;

  return (
    <Link
      href={withLocale("/favoris")}
      className="chc-fav-nav"
      aria-label={`${t.nav.favorites} (${count})`}
      title={t.nav.favorites}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9z"
          fill={count > 0 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span key={count} className="chc-fav-nav-count">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
