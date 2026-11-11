"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ApiClientError } from "@/services/apiClient";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types/listing";
import { MAX_COMPARE, useCompare } from "@/utils/compareStore";
import { formatMileage, formatPrice } from "@/utils/listingLabels";
import { listingPath } from "@/utils/listingPath";
import { vehicleTitle } from "@/utils/vehicleLabels";

type Best = "min" | "max";

interface Row {
  label: string;
  value: (listing: Listing) => ReactNode;
  /** Numeric rows: the best column gets highlighted (when they differ). */
  best?: { pick: Best; of: (listing: Listing) => number | null };
}

/** Index of the best column, or -1 when there is no clear winner. */
function bestIndex(listings: Listing[], best: Row["best"]): number {
  if (!best || listings.length < 2) return -1;
  const values = listings.map(best.of);
  const known = values.filter((value): value is number => value !== null);
  if (known.length < 2 || known.every((value) => value === known[0])) return -1;
  const target = best.pick === "min" ? Math.min(...known) : Math.max(...known);
  return values.filter((value) => value === target).length === 1 ? values.indexOf(target) : -1;
}

/**
 * Comparator: the cars picked with « Comparer » (up to 3), side by side.
 * Each is refreshed from the API (price or status may have changed since it
 * was picked); the best value of each numeric row is highlighted.
 */
export default function ComparePage() {
  const { t, locale, withLocale } = useLanguage();
  const { items, remove } = useCompare();
  /** Latest data per id; `null` when the listing is gone or no longer public. */
  const [fresh, setFresh] = useState<Record<number, Listing | null>>({});
  const ids = items.map((item) => item.id).join(",");

  useEffect(() => {
    if (!ids) return;
    for (const id of ids.split(",").map(Number)) {
      listingService
        .getById(id)
        .then((listing) => setFresh((current) => ({ ...current, [id]: listing })))
        .catch((err: unknown) => {
          if (err instanceof ApiClientError && err.status === 404) {
            setFresh((current) => ({ ...current, [id]: null }));
          }
        });
    }
  }, [ids]);

  const listings = items.map((item) => fresh[item.id] ?? item);
  const gone = (listing: Listing) => fresh[listing.id] === null || listing.status !== "published";

  const rows: Row[] = [
    {
      label: t.compare.price,
      value: (l) => formatPrice(l.price, locale),
      best: { pick: "min", of: (l) => l.price },
    },
    { label: t.listingDetail.year, value: (l) => l.year, best: { pick: "max", of: (l) => l.year } },
    {
      label: t.listingDetail.mileage,
      value: (l) => formatMileage(l.mileage, locale),
      best: { pick: "min", of: (l) => l.mileage },
    },
    { label: t.listingDetail.fuel, value: (l) => t.vehicle.fuelType[l.fuelType] },
    { label: t.listingDetail.gearbox, value: (l) => t.vehicle.transmission[l.transmission] },
    {
      label: t.listingDetail.power,
      value: (l) => (l.power ? `${l.power} ${t.vehicle.powerUnit}` : "—"),
      best: { pick: "max", of: (l) => l.power },
    },
    { label: t.listingDetail.doors, value: (l) => l.doors ?? "—" },
    { label: t.listingDetail.color, value: (l) => l.color ?? "—" },
    { label: t.listingDetail.category, value: (l) => l.category?.name ?? "—" },
  ];

  if (listings.length === 0) {
    return (
      <section className="chc-compare-empty">
        <span className="chc-compare-empty-icon" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3" />
          </svg>
        </span>
        <h1 className="h3">{t.compare.title}</h1>
        <p className="text-secondary mb-4">{t.compare.empty}</p>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <Link href={withLocale("/annonces")} className="btn btn-primary">
            {t.compare.browse}
          </Link>
          <Link href={withLocale("/trouver")} className="btn btn-outline-primary">
            {t.finder.cta}
          </Link>
        </div>
      </section>
    );
  }

  const winners = rows.map((row) => bestIndex(listings.filter((l) => !gone(l)), row.best));
  /** Winner index among available cars → index among all columns. */
  const available = listings.filter((l) => !gone(l));
  const isWinner = (rowIndex: number, listing: Listing) =>
    winners[rowIndex] >= 0 && available[winners[rowIndex]]?.id === listing.id;

  return (
    <section>
      <h1 className="h3 mb-1">{t.compare.title}</h1>
      <p className="text-secondary mb-4">{t.compare.lead}</p>

      <div className="chc-compare-scroll">
        <table className="chc-compare-table">
          <thead>
            <tr>
              <th scope="col" className="chc-compare-corner" />
              {listings.map((listing) => (
                <th key={listing.id} scope="col" className="chc-compare-car">
                  <div className="chc-compare-photo">
                    {listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.images[0].thumbnailUrl} alt="" />
                    ) : (
                      <span aria-hidden="true">🚗</span>
                    )}
                    <button
                      type="button"
                      className="chc-compare-remove"
                      aria-label={`${t.compare.removeColumn} : ${listing.title}`}
                      title={t.compare.removeColumn}
                      onClick={() => remove(listing.id)}
                    >
                      ×
                    </button>
                  </div>
                  <Link href={withLocale(listingPath(listing))} className="chc-compare-title">
                    {listing.title}
                  </Link>
                  <div className="chc-compare-sub">{vehicleTitle(listing)}</div>
                  {gone(listing) && <span className="badge text-bg-secondary mt-1">{t.compare.unavailable}</span>}
                </th>
              ))}
              {listings.length < MAX_COMPARE && (
                <th scope="col" className="chc-compare-car">
                  <Link href={withLocale("/annonces")} className="chc-compare-add">
                    <span aria-hidden="true">+</span>
                    {t.compare.addMore}
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {listings.map((listing) => (
                  <td key={listing.id} className={isWinner(rowIndex, listing) ? "is-best" : undefined}>
                    {row.value(listing)}
                    {isWinner(rowIndex, listing) && <span className="chc-compare-best">{t.compare.best}</span>}
                  </td>
                ))}
                {listings.length < MAX_COMPARE && <td aria-hidden="true" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
