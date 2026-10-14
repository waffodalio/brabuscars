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
  /** True while a toggle request is in flight. */
  pending: boolean;
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
  const [pending, setPending] = useState(false);

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

  const toggle = useCallback(
    async (listingId: number) => {
      setPending(true);
      try {
        if (favoriteIds.has(listingId)) {
          try {
            await favoriteService.remove(listingId);
          } catch (err) {
            // 404: already removed (other tab / device) — just sync the list.
            if (!(err instanceof ApiClientError && err.status === 404)) throw err;
          }
          setFavorites((current) =>
            current.filter((favorite) => favorite.listingId !== listingId),
          );
        } else {
          const created = await favoriteService.add(listingId);
          setFavorites((current) => [created, ...current]);
        }
      } finally {
        setPending(false);
      }
    },
    [favoriteIds],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, loading, loadFailed, pending, isFavorite, toggle }),
    [favorites, loading, loadFailed, pending, isFavorite, toggle],
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
