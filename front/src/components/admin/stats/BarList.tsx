import type { ReactNode } from "react";
import { formatNumber, formatPercent } from "./format";

export interface BarListItem {
  key: string;
  label: ReactNode;
  value: number;
}

/**
 * Ranked horizontal bars — one colour (it is one measure), label and figure
 * written out, share of `total` alongside.
 */
export function BarList({
  items,
  total,
  empty = "Aucune donnée.",
}: {
  items: BarListItem[];
  total: number;
  empty?: string;
}) {
  if (items.length === 0) return <p className="text-secondary small mb-0">{empty}</p>;
  const max = Math.max(...items.map((item) => item.value));
  return (
    <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
      {items.map((item) => (
        <li key={item.key}>
          <div className="d-flex justify-content-between gap-3 small">
            <span className="text-truncate">{item.label}</span>
            <span className="text-nowrap chc-num">
              <span className="fw-semibold">{formatNumber(item.value)}</span>
              {total > 0 && (
                <span className="text-secondary ms-2">{formatPercent(item.value / total)}</span>
              )}
            </span>
          </div>
          <div className="chc-bar-track" aria-hidden="true">
            <div className="chc-bar-fill" style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
