"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Listing } from "@/types/listing";
import { useCompare } from "@/utils/compareStore";

const ARROWS = "M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3";

/** Round toggle putting a listing in (or out of) the comparator. */
export function CompareButton({ listing, className }: { listing: Listing; className?: string }) {
  const { t } = useLanguage();
  const { isSelected, toggle, full } = useCompare();
  const selected = isSelected(listing.id);
  const label = selected ? t.compare.remove : full ? t.compare.full : t.compare.add;

  return (
    <button
      type="button"
      className={`chc-fav-btn chc-compare-btn${selected ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      disabled={!selected && full}
      onClick={() => toggle(listing)}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={ARROWS} />
      </svg>
    </button>
  );
}
