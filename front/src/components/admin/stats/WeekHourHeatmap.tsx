"use client";

import { useState } from "react";
import { formatNumber } from "./format";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
/** Legend steps, light → dark (share of the busiest slot). */
const LEGEND = [0.15, 0.35, 0.55, 0.75, 1];

/**
 * Brand colour faded toward the card surface: one hue, light → dark. (Mixed
 * with `transparent` — `--bs-card-bg` is self-referencing inside `.card`.)
 */
function cellColor(ratio: number): string | undefined {
  if (ratio <= 0) return undefined; // empty slot: plain track colour
  return `color-mix(in srgb, var(--bs-primary) ${Math.round(12 + ratio * 88)}%, transparent)`;
}

const slotLabel = (day: number, hour: number) => `${DAYS[day]} ${hour} h – ${hour + 1} h`;

/**
 * Page views by weekday × hour of the day. Sequential single-hue scale with a
 * legend; hovering (or focusing) a cell names the slot and its figure.
 */
export function WeekHourHeatmap({ grid, timeZone }: { grid: number[][]; timeZone: string }) {
  const [active, setActive] = useState<{ day: number; hour: number } | null>(null);
  const max = Math.max(0, ...grid.flat());

  let peak = { day: 0, hour: 0 };
  grid.forEach((row, day) =>
    row.forEach((value, hour) => {
      if (value > grid[peak.day][peak.hour]) peak = { day, hour };
    }),
  );
  const shown = active ?? (max > 0 ? peak : null);

  return (
    <div>
      <p className="small mb-3" aria-live="polite">
        {shown ? (
          <>
            <span className="text-secondary">{active ? "Créneau" : "Pic d'affluence"} :</span>{" "}
            <strong>{slotLabel(shown.day, shown.hour)}</strong>
            <span className="text-secondary">
              {" "}· {formatNumber(grid[shown.day][shown.hour])} pages vues
            </span>
          </>
        ) : (
          <span className="text-secondary">Aucune visite sur la période.</span>
        )}
      </p>

      <div className="chc-heatmap" onMouseLeave={() => setActive(null)} aria-hidden="true">
        {grid.map((row, day) => (
          <div key={day} className="chc-heatmap-row">
            <span className="chc-heatmap-day">{DAYS[day].slice(0, 3)}</span>
            {row.map((value, hour) => (
              <span
                key={hour}
                className={`chc-heatmap-cell${
                  active?.day === day && active.hour === hour ? " is-active" : ""
                }`}
                style={{ backgroundColor: cellColor(max > 0 ? value / max : 0) }}
                onMouseEnter={() => setActive({ day, hour })}
                // Touch screens have no hover: a tap selects the slot.
                onClick={() => setActive({ day, hour })}
              />
            ))}
          </div>
        ))}
        <div className="chc-heatmap-row">
          <span className="chc-heatmap-day" />
          {HOURS.map((hour) => (
            // Every 3 h, only every 6 h on narrow screens (see globals.css).
            <span key={hour} className={`chc-heatmap-hour${hour % 6 === 0 ? "" : " chc-heatmap-hour--minor"}`}>
              {hour % 3 === 0 ? `${hour}h` : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 small text-secondary">
        <span>Heure de {timeZone === "Europe/Paris" ? "Paris" : timeZone}</span>
        <span className="d-inline-flex align-items-center gap-1" aria-hidden="true">
          Moins
          {LEGEND.map((ratio) => (
            <span key={ratio} className="chc-heatmap-swatch" style={{ backgroundColor: cellColor(ratio) }} />
          ))}
          Plus
        </span>
      </div>

      <div className="visually-hidden">
        <table>
          <caption>Pages vues par jour de la semaine et par heure</caption>
          <thead>
            <tr>
              <th scope="col">Jour</th>
              {HOURS.map((hour) => (
                <th key={hour} scope="col">{hour} h</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, day) => (
              <tr key={day}>
                <th scope="row">{DAYS[day]}</th>
                {row.map((value, hour) => (
                  <td key={hour}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
