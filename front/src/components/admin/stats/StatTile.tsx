import { useId, type ReactNode } from "react";
import Card from "react-bootstrap/Card";
import { AdminIcon } from "../AdminIcon";
import { formatPercent, relativeChange } from "./format";

const ARROW_UP = "M12 19V5M5 12l7-7 7 7";
const ARROW_DOWN = "M12 5v14M5 12l7 7 7-7";

/**
 * Change against the previous period: arrow + signed figure + wording, so the
 * trend never relies on colour alone.
 *
 * - `mode="relative"` (default): relative change, `+12 %`.
 * - `mode="points"`: for rates (`current` / `previous` are ratios), the
 *   difference in percentage points, `+3 pts`.
 * - `inverse`: a rise is bad news (e.g. bounce rate), so it is coloured as such.
 */
export function Delta({
  current,
  previous,
  mode = "relative",
  inverse = false,
}: {
  current: number;
  previous: number;
  mode?: "relative" | "points";
  inverse?: boolean;
}) {
  const change = mode === "points" ? current - previous : relativeChange(current, previous);
  if (change === null || (mode === "points" && previous === 0 && current === 0)) {
    return (
      <span className="chc-delta chc-delta--flat">
        {current > 0 ? "nouveau" : "—"}
      </span>
    );
  }
  const rounded = Math.round(change * 100);
  if (rounded === 0) {
    return <span className="chc-delta chc-delta--flat">stable</span>;
  }
  const up = rounded > 0;
  const good = up !== inverse;
  return (
    <span
      className={`chc-delta ${good ? "chc-delta--good" : "chc-delta--bad"}`}
      title="Par rapport à la période précédente"
    >
      <AdminIcon d={up ? ARROW_UP : ARROW_DOWN} size={11} />
      {up ? "+" : "−"}
      {mode === "points" ? `${Math.abs(rounded)} pts` : formatPercent(Math.abs(change))}
      <span className="visually-hidden"> par rapport à la période précédente</span>
    </span>
  );
}

const SPARK_HEIGHT = 40;

/** A trend line without axes; the tile's number carries the value. */
export function Sparkline({ values, height = SPARK_HEIGHT }: { values: number[]; height?: number }) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const step = 100 / (values.length - 1);
  const points = values.map(
    (value, i) => `${(i * step).toFixed(2)},${(height - 2 - (value / max) * (height - 6)).toFixed(2)}`,
  );
  return (
    <svg
      className="chc-sparkline"
      style={{ height }}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="chc-sparkline-stop-top" />
          <stop offset="100%" className="chc-sparkline-stop-bottom" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points.join(" ")} 100,${height}`} fill={`url(#${gradientId})`} />
      <polyline points={points.join(" ")} className="chc-sparkline-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * Tiny column chart for sparse daily counts (messages, sign-ups…), where a
 * line would zigzag between zeros. Decorative: the figure carries the value.
 */
export function MiniBars({ values, height = 32 }: { values: number[]; height?: number }) {
  if (values.length === 0) return null;
  const max = Math.max(1, ...values);
  const band = 100 / values.length;
  const width = Math.max(band * 0.7, 0.6);
  return (
    <svg className="chc-minibars" style={{ height }} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2="100" y1={height - 0.5} y2={height - 0.5} className="chc-minibars-base" vectorEffect="non-scaling-stroke" />
      {values.map((value, i) =>
        value > 0 ? (
          <rect
            key={i}
            x={i * band + (band - width) / 2}
            y={height - (value / max) * (height - 2)}
            width={width}
            height={(value / max) * (height - 2)}
            rx={0.6}
            className="chc-minibars-bar"
          />
        ) : null,
      )}
    </svg>
  );
}

/** Headline figure of the period, its trend and an optional daily sparkline. */
export function StatTile({
  label,
  value,
  icon,
  current,
  previous,
  mode,
  inverse,
  trend,
  hint,
  size = "lg",
}: {
  label: string;
  value: string;
  /** Path of an {@link AdminIcon}. */
  icon?: string;
  current?: number;
  previous?: number;
  mode?: "relative" | "points";
  inverse?: boolean;
  trend?: number[];
  hint?: ReactNode;
  /** `sm`: secondary figures, no sparkline, tighter. */
  size?: "lg" | "sm";
}) {
  return (
    <Card className={`h-100 chc-stat chc-stat--${size}`}>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex align-items-center gap-2">
          {icon && (
            <span className="chc-stat-icon">
              <AdminIcon d={icon} size={size === "lg" ? 16 : 14} />
            </span>
          )}
          <span className="chc-stat-label">{label}</span>
        </div>
        <div className="d-flex flex-wrap align-items-center column-gap-2 row-gap-1 mt-2">
          <span className="chc-stat-value chc-num">{value}</span>
          {current !== undefined && previous !== undefined && (
            <Delta current={current} previous={previous} mode={mode} inverse={inverse} />
          )}
        </div>
        {hint && <div className="chc-stat-hint">{hint}</div>}
        {trend && (
          <div className="mt-auto pt-3">
            <Sparkline values={trend} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
