import type { ReactNode } from "react";
import Card from "react-bootstrap/Card";
import { AdminIcon } from "../AdminIcon";
import { formatPercent, relativeChange } from "./format";

const ARROW_UP = "M12 19V5M5 12l7-7 7 7";
const ARROW_DOWN = "M12 5v14M5 12l7 7 7-7";

/**
 * Change against the previous period: arrow + signed percentage + wording, so
 * the trend never relies on colour alone.
 */
export function Delta({ current, previous }: { current: number; previous: number }) {
  const change = relativeChange(current, previous);
  if (change === null) {
    return (
      <span className="chc-delta text-secondary">
        {current > 0 ? "nouveau sur la période" : "—"}
      </span>
    );
  }
  const rounded = Math.round(change * 100);
  if (rounded === 0) {
    return <span className="chc-delta text-secondary">stable</span>;
  }
  const up = rounded > 0;
  return (
    <span
      className={`chc-delta ${up ? "chc-delta--up" : "chc-delta--down"}`}
      title="Par rapport à la période précédente"
    >
      <AdminIcon d={up ? ARROW_UP : ARROW_DOWN} size={12} />
      {up ? "+" : ""}
      {formatPercent(change)}
      <span className="visually-hidden"> par rapport à la période précédente</span>
    </span>
  );
}

const SPARK_HEIGHT = 36;

/** A trend line without axes; the tile's number carries the value. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const step = 100 / (values.length - 1);
  const points = values.map(
    (value, i) => `${(i * step).toFixed(2)},${(SPARK_HEIGHT - 2 - (value / max) * (SPARK_HEIGHT - 4)).toFixed(2)}`,
  );
  return (
    <svg
      className="chc-sparkline"
      viewBox={`0 0 100 ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={`0,${SPARK_HEIGHT} ${points.join(" ")} 100,${SPARK_HEIGHT}`} className="chc-sparkline-area" />
      <polyline points={points.join(" ")} className="chc-sparkline-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Headline figure of the period, its trend and an optional daily sparkline. */
export function StatTile({
  label,
  value,
  current,
  previous,
  trend,
  hint,
}: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  trend?: number[];
  hint?: ReactNode;
}) {
  return (
    <Card className="h-100 chc-stat">
      <Card.Body className="d-flex flex-column">
        <div className="text-secondary small fw-medium">{label}</div>
        <div className="d-flex flex-wrap align-items-baseline gap-2 mt-1">
          <span className="chc-stat-value">{value}</span>
          {current !== undefined && previous !== undefined && (
            <Delta current={current} previous={previous} />
          )}
        </div>
        {hint && <div className="text-secondary small mt-1">{hint}</div>}
        {trend && (
          <div className="mt-auto pt-2">
            <Sparkline values={trend} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
