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
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/services/apiClient";
import { favoriteService } from "@/services/favoriteService";
import type { Favorite } from "@/types/favorite";

interface FavoritesContextValue {
  favorites: Favorite[];
  loading: boolean;
  /** The favourites could not be loaded (the list is empty for that reason). */
  loadFailed: boolean;
  /** True while this listing's toggle request is in flight. */
  isPending: (listingId: number) => boolean;
  isFavorite: (listingId: number) => boolean;
  /** Rejects with the API error on failure: the caller shows it. */
  toggle: (listingId: number) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  /** Listings being toggled: each button is busy on its own, not all of them. */
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    setLoadFailed(false);
    if (!user) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    favoriteService
      .list()
      .then(setFavorites)
      .catch(() => {
        setFavorites([]);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.listingId)),
    [favorites],
  );

  const isFavorite = useCallback(
    (listingId: number) => favoriteIds.has(listingId),
    [favoriteIds],
  );

  const isPending = useCallback(
    (listingId: number) => pendingIds.has(listingId),
    [pendingIds],
  );

  const setPending = useCallback((listingId: number, busy: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (busy) next.add(listingId);
      else next.delete(listingId);
      return next;
    });
  }, []);

  const toggle = useCallback(
    async (listingId: number) => {
      setPending(listingId, true);
      try {
        if (favoriteIds.has(listingId)) {
          // Optimistic: the star empties at once, put back if the call fails.
          const removed = favorites.find((favorite) => favorite.listingId === listingId);
          setFavorites((current) =>
            current.filter((favorite) => favorite.listingId !== listingId),
          );
          try {
            await favoriteService.remove(listingId);
          } catch (err) {
            // 404: already removed (other tab / device) — nothing to undo.
            if (!(err instanceof ApiClientError && err.status === 404)) {
              if (removed) setFavorites((current) => [removed, ...current]);
              throw err;
            }
          }
        } else {
          const created = await favoriteService.add(listingId);
          setFavorites((current) => [created, ...current]);
        }
      } finally {
        setPending(listingId, false);
      }
    },
    [favoriteIds, favorites, setPending],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, loading, loadFailed, isPending, isFavorite, toggle }),
    [favorites, loading, loadFailed, isPending, isFavorite, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
