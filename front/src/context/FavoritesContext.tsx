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
import { favoriteService } from "@/services/favoriteService";
import type { Favorite } from "@/types/favorite";

interface FavoritesContextValue {
  favorites: Favorite[];
  loading: boolean;
  /** True while a toggle request is in flight. */
  pending: boolean;
  isFavorite: (listingId: number) => boolean;
  toggle: (listingId: number) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    favoriteService
      .list()
      .then(setFavorites)
      .catch(() => setFavorites([]))
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
          await favoriteService.remove(listingId);
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
    () => ({ favorites, loading, pending, isFavorite, toggle }),
    [favorites, loading, pending, isFavorite, toggle],
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
