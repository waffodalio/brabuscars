"use client";

import { useSyncExternalStore } from "react";
import type { Listing } from "@/types/listing";

/** At most this many cars side by side (beyond that, columns get unreadable). */
export const MAX_COMPARE = 3;
const STORAGE_KEY = "chcars_compare";
const EMPTY: Listing[] = [];

/**
 * Cars picked for the comparator. A tiny store kept for the tab
 * (sessionStorage), read through `useSyncExternalStore`: the server and the
 * first client render see an empty list (no hydration mismatch), the saved
 * picks appear right after.
 */
let items: Listing[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Listing[] {
  if (!loaded) {
    loaded = true;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]");
      items = Array.isArray(saved) ? (saved as Listing[]).slice(0, MAX_COMPARE) : EMPTY;
    } catch {
      items = EMPTY;
    }
  }
  return items;
}

function write(next: Listing[]): void {
  items = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage full: the picks still last for this page */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export interface CompareApi {
  items: Listing[];
  isSelected: (id: number) => boolean;
  full: boolean;
  /** Adds or removes; returns false when the list is already full. */
  toggle: (listing: Listing) => boolean;
  remove: (id: number) => void;
  clear: () => void;
}

export function useCompare(): CompareApi {
  const current = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items: current,
    isSelected: (id) => current.some((item) => item.id === id),
    full: current.length >= MAX_COMPARE,
    toggle: (listing) => {
      const list = read();
      if (list.some((item) => item.id === listing.id)) {
        write(list.filter((item) => item.id !== listing.id));
        return true;
      }
      if (list.length >= MAX_COMPARE) return false;
      write([...list, listing]);
      return true;
    },
    remove: (id) => write(read().filter((item) => item.id !== id)),
    clear: () => write(EMPTY),
  };
}
