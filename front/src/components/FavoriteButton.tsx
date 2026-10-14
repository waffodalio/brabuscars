"use client";

import { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
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
  const { isFavorite, toggle, pending } = useFavorites();
  const { t } = useLanguage();
  const toMessage = usePublicErrorMessage();
  const target = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(""), ERROR_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (!user) return null;

  const active = isFavorite(listingId);

  async function handleClick() {
    setError("");
    try {
      await toggle(listingId);
    } catch (err) {
      setError(toMessage(err, t.favorites.toggleError));
    }
  }

  return (
    <>
      <Button
        ref={target}
        size="sm"
        variant={active ? "danger" : "outline-danger"}
        className={className}
        disabled={pending}
        aria-pressed={active}
        onClick={() => {
          void handleClick();
        }}
      >
        <span key={String(active)} className="chc-fav-pop d-inline-block">
          {active ? "★" : "☆"} {t.favorites.button}
        </span>
      </Button>
      <Overlay target={target} show={Boolean(error)} placement="bottom">
        <Tooltip id={`favorite-error-${listingId}`} role="alert">
          {error}
        </Tooltip>
      </Overlay>
    </>
  );
}
