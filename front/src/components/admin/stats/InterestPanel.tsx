"use client";

import { useState } from "react";
import type { InterestRow, ListingInterest } from "@/types/analytics";
import type { FuelType } from "@/types/vehicle";
import { FUEL_TYPE_LABELS } from "@/utils/vehicleLabels";
import { BarList } from "./BarList";
import { formatNumber } from "./format";

const PRICE_BAND_LABELS: Record<string, string> = {
  "<15k": "Moins de 15 000 €",
  "15-30k": "15 000 – 30 000 €",
  "30-50k": "30 000 – 50 000 €",
  "50-100k": "50 000 – 100 000 €",
  "100k+": "100 000 € et plus",
};
const PRICE_BAND_ORDER = Object.keys(PRICE_BAND_LABELS);

type Dimension = keyof ListingInterest;

const DIMENSIONS: { key: Dimension; label: string; labelOf: (bucket: string) => string }[] = [
  { key: "brands", label: "Marques", labelOf: (b) => b || "Sans marque" },
  { key: "categories", label: "Catégories", labelOf: (b) => b || "Sans catégorie" },
  { key: "fuels", label: "Énergie", labelOf: (b) => FUEL_TYPE_LABELS[b as FuelType] ?? b },
  { key: "priceBands", label: "Prix", labelOf: (b) => PRICE_BAND_LABELS[b] ?? b },
];

/** Price bands read in price order; the others are ranked by views. */
function ordered(key: Dimension, rows: InterestRow[]): InterestRow[] {
  if (key !== "priceBands") return rows;
  return [...rows].sort((a, b) => PRICE_BAND_ORDER.indexOf(a.bucket) - PRICE_BAND_ORDER.indexOf(b.bucket));
}

/**
 * What the visitors look at: listing views grouped by brand, category, fuel
 * type or price band — one dimension at a time.
 */
export function InterestPanel({ interest, total }: { interest: ListingInterest; total: number }) {
  const [dimension, setDimension] = useState<Dimension>("brands");
  const active = DIMENSIONS.find((d) => d.key === dimension) ?? DIMENSIONS[0];
  const rows = ordered(dimension, interest[dimension]);

  return (
    <>
      <div className="chc-segmented mb-3" role="group" aria-label="Regrouper par">
        {DIMENSIONS.map((d) => (
          <button
            key={d.key}
            type="button"
            className={d.key === dimension ? "is-active" : undefined}
            aria-pressed={d.key === dimension}
            onClick={() => setDimension(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <BarList
        total={total}
        empty="Aucune fiche annonce consultée sur la période."
        items={rows.map((row) => ({
          key: row.bucket || "none",
          label: active.labelOf(row.bucket),
          value: row.views,
          secondary: `${formatNumber(row.visitors)} visiteurs`,
        }))}
      />
    </>
  );
}
