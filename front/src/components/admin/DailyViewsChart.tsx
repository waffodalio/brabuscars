"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyViews } from "@/types/analytics";

const HEIGHT = 220;
const MARGIN = { top: 12, right: 8, bottom: 26, left: 40 };
/** Surface gap between adjacent bars. */
const GAP = 2;
const MAX_BAR_WIDTH = 28;

/** 1, 2 or 5 × a power of ten, at least 1 (counts are integers). */
function niceStep(raw: number): number {
  if (raw <= 1) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const n = raw / power;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power;
}

/** About four integer gridlines covering `max`. */
function yTicks(max: number): number[] {
  const step = niceStep(max / 4);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
}

/** Bar with 4px rounded top corners, square on the baseline. */
function barPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(4, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
export const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));

/** Width of the wrapping element, kept up to date. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Page views per day — single series, so no legend (the card title names it).
 * Hovering a day shows its exact figures; a visually hidden table carries the
 * same data for screen readers.
 */
export function DailyViewsChart({ data }: { data: DailyViews[] }) {
  const [containerRef, width] = useWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const ticks = yTicks(Math.max(0, ...data.map((d) => d.pageViews)));
  const top = ticks[ticks.length - 1];
  const band = data.length > 0 ? innerWidth / data.length : 0;
  const barWidth = Math.max(1, Math.min(MAX_BAR_WIDTH, band - GAP));
  const y = (value: number) => MARGIN.top + innerHeight - (value / top) * innerHeight;
  const labelIndexes = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])];
  const active = hovered !== null ? data[hovered] : null;

  return (
    <div ref={containerRef} className="chc-chart position-relative">
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label="Histogramme des pages vues par jour"
          onMouseLeave={() => setHovered(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? "chc-chart-baseline" : "chc-chart-grid"}
              />
              <text x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="chc-chart-label">
                {tick.toLocaleString("fr-FR")}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const x = MARGIN.left + i * band + (band - barWidth) / 2;
            const height = y(0) - y(d.pageViews);
            return (
              <g key={d.day}>
                {height > 0 && (
                  <path
                    d={barPath(x, y(d.pageViews), barWidth, height)}
                    className="chc-chart-bar"
                    opacity={hovered === null || hovered === i ? 1 : 0.45}
                  />
                )}
                {/* Hit target: the whole column, wider and taller than the bar. */}
                <rect
                  x={MARGIN.left + i * band}
                  y={MARGIN.top}
                  width={band}
                  height={innerHeight}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                />
              </g>
            );
          })}

          {labelIndexes.map((i) => (
            <text
              key={i}
              x={MARGIN.left + i * band + band / 2}
              y={HEIGHT - 6}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              className="chc-chart-label"
            >
              {formatDay(data[i].day)}
            </text>
          ))}
        </svg>
      )}

      {active && hovered !== null && (
        <div
          className="chc-chart-tooltip"
          style={{
            left: Math.min(Math.max(MARGIN.left + hovered * band + band / 2, 70), width - 70),
            top: y(active.pageViews) - 8,
          }}
          aria-hidden="true"
        >
          <div className="fw-semibold">{formatDay(active.day)}</div>
          <div>{active.pageViews.toLocaleString("fr-FR")} pages vues</div>
          <div className="text-secondary">{active.visitors.toLocaleString("fr-FR")} visiteurs</div>
        </div>
      )}

      <table className="visually-hidden">
        <caption>Pages vues et visiteurs par jour</caption>
        <thead>
          <tr>
            <th scope="col">Jour</th>
            <th scope="col">Pages vues</th>
            <th scope="col">Visiteurs</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <th scope="row">{formatDay(d.day)}</th>
              <td>{d.pageViews}</td>
              <td>{d.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
