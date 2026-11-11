"use client";

import { useEffect, useRef, useState } from "react";
import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePublicErrorMessage } from "@/hooks/usePublicErrorMessage";

/** How long a failed toggle's message stays visible. */
const ERROR_VISIBLE_MS = 4000;

interface FavoriteButtonProps {
  listingId: number;
  className?: string;
}

/**
 * Toggle a listing in the current user's favourites. Renders nothing when
 * no one is signed in. A failure (expired session, advert taken offline,
 * API unreachable…) is shown in a tooltip anchored on the button — it sits
 * over the card photo, where inline text would not fit.
 */
export function FavoriteButton({ listingId, className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggle, isPending } = useFavorites();
  const { t } = useLanguage();
  const toMessage = usePublicErrorMessage();
  const target = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState("");
  /** Bumped on each "add": replays the sparkle burst. */
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), ERROR_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (!user) return null;

  const active = isFavorite(listingId);
  const label = active ? t.favorites.remove : t.favorites.add;

  async function handleClick() {
    setError("");
    try {
      if (!active) setBurst((count) => count + 1);
      await toggle(listingId);
    } catch (err) {
      setError(toMessage(err, t.favorites.toggleError));
    }
  }

  return (
    <>
      <button
        ref={target}
        type="button"
        className={`chc-fav-btn${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
        disabled={isPending(listingId)}
        aria-pressed={active}
        aria-label={label}
        title={label}
        onClick={() => {
          void handleClick();
        }}
      >
        <svg key={String(active)} className="chc-fav-pop" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9z"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        {burst > 0 && active && (
          <span key={burst} className="chc-fav-burst" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ "--chc-angle": `${i * 45}deg` } as React.CSSProperties} />
            ))}
          </span>
        )}
      </button>
      <Overlay target={target} show={Boolean(error)} placement="bottom">
        <Tooltip id={`favorite-error-${listingId}`} role="alert">
          {error}
        </Tooltip>
      </Overlay>
    </>
  );
}
