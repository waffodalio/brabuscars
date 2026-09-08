"use client";

import Button from "react-bootstrap/Button";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

interface FavoriteButtonProps {
  listingId: number;
  className?: string;
}

/**
 * Toggle a listing in the current user's favourites. Renders nothing when
 * no one is signed in.
 */
export function FavoriteButton({ listingId, className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggle, pending } = useFavorites();

  if (!user) return null;

  const active = isFavorite(listingId);

  return (
    <Button
      size="sm"
      variant={active ? "danger" : "outline-danger"}
      className={className}
      disabled={pending}
      aria-pressed={active}
      onClick={() => {
        void toggle(listingId);
      }}
    >
      {active ? "★ Favori" : "☆ Favori"}
    </Button>
  );
}
