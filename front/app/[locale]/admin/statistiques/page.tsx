"use client";

import { useState } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { StatsReport } from "@/components/admin/stats/StatsReport";
import { useAsync } from "@/hooks/useAsync";
import { analyticsService } from "@/services/analyticsService";
import { INTL_LOCALES } from "@/i18n/locales";
import { ANALYTICS_PERIODS, type AnalyticsPeriod, type DailyViews } from "@/types/analytics";

const REFRESH = "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6";
const DOWNLOAD = "M12 3v12M7 10l5 5 5-5M4 21h16";

/** Daily series as a CSV file (`;` separator, BOM) that Excel opens directly. */
function downloadCsv(daily: DailyViews[], days: number) {
  const lines = [
    "jour;pages vues;visiteurs;visites;fiches annonces vues",
    ...daily.map((d) => `${d.day};${d.pageViews};${d.visitors};${d.visits};${d.listingViews}`),
  ];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chcars-statistiques-${days}j.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const timeFormat = new Intl.DateTimeFormat(INTL_LOCALES.fr, { hour: "2-digit", minute: "2-digit" });

export default function AdminStatisticsPage() {
  const [days, setDays] = useState<AnalyticsPeriod>(30);
  const [reload, setReload] = useState(0);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const state = useAsync(async () => {
    const summary = await analyticsService.summary(days);
    setLoadedAt(new Date());
    return summary;
  }, [days, reload]);

  return (
    <section>
      <header className="chc-stats-header">
        <div>
          <h1 className="h3 mb-1">Statistiques</h1>
          <p className="text-secondary small mb-0">
            Audience du site, intérêt pour les annonces et état du stock.
            {loadedAt && <> · Mis à jour à {timeFormat.format(loadedAt)}</>}
          </p>
        </div>
        <div className="chc-stats-toolbar">
          <div className="chc-segmented chc-segmented--lg" role="group" aria-label="Période">
            {ANALYTICS_PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                className={period === days ? "is-active" : undefined}
                aria-pressed={period === days}
                onClick={() => setDays(period)}
              >
                {period} jours
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={state.status === "loading"}
            onClick={() => setReload((n) => n + 1)}
            aria-label="Actualiser"
            title="Actualiser"
          >
            <AdminIcon d={REFRESH} size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={state.status !== "ready"}
            onClick={() => state.status === "ready" && downloadCsv(state.data.daily, days)}
          >
            <AdminIcon d={DOWNLOAD} size={14} />
            <span className="ms-1">Exporter (CSV)</span>
          </Button>
        </div>
      </header>

      {state.status === "loading" && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" role="status" aria-label="Chargement" />
        </div>
      )}
      <ErrorAlert message={state.status === "error" ? state.error : undefined} />

      {state.status === "ready" && (
        <>
          <StatsReport data={state.data} />
          <p className="chc-stats-footnote">
            Seuls les visiteurs ayant accepté le cookie de mesure d&apos;audience sont comptés ;
            l&apos;administration n&apos;est jamais mesurée. Données conservées 13 mois. Les
            évolutions comparent la période à la même durée juste avant.
          </p>
        </>
      )}
    </section>
  );
}
