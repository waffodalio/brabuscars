"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { MAX_COMPARE, useCompare } from "@/utils/compareStore";

/**
 * Floating bar at the bottom of the public pages while cars are picked for
 * the comparator: their thumbnails (each removable), then « Comparer ».
 * Hidden on the comparator itself and in the back-office.
 */
export function CompareTray() {
  const pathname = usePathname();
  const { t, withLocale } = useLanguage();
  const { items, remove, clear } = useCompare();
  const section = pathname.split("/")[2];

  if (items.length === 0 || section === "admin" || section === "comparer") return null;

  return (
    <div className="chc-compare-tray" role="region" aria-label={t.compare.title}>
      <div className="chc-compare-slots">
        {items.map((listing) => (
          <span key={listing.id} className="chc-compare-slot" title={listing.title}>
            {listing.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.images[0].thumbnailUrl} alt="" />
            ) : (
              <span aria-hidden="true">🚗</span>
            )}
            <button
              type="button"
              className="chc-compare-slot-remove"
              aria-label={`${t.compare.remove} : ${listing.title}`}
              onClick={() => remove(listing.id)}
            >
              ×
            </button>
          </span>
        ))}
        {Array.from({ length: MAX_COMPARE - items.length }, (_, i) => (
          <span key={`empty-${i}`} className="chc-compare-slot is-empty" aria-hidden="true" />
        ))}
      </div>
      <span className="chc-compare-tray-label">{t.compare.tray(items.length)}</span>
      <button type="button" className="chc-compare-tray-clear" onClick={clear}>
        {t.compare.clear}
      </button>
      <Link href={withLocale("/comparer")} className="btn btn-primary btn-sm chc-compare-tray-go">
        {t.compare.open}
      </Link>
    </div>
  );
}
