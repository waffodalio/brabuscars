"use client";

import { useState } from "react";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Spinner from "react-bootstrap/Spinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { StatsReport } from "@/components/admin/stats/StatsReport";
import { useAsync } from "@/hooks/useAsync";
import { analyticsService } from "@/services/analyticsService";
import { ANALYTICS_PERIODS, type AnalyticsPeriod, type DailyViews } from "@/types/analytics";

/** Daily series as a CSV file (`;` separator, BOM) that Excel opens directly. */
function downloadCsv(daily: DailyViews[], days: number) {
  const lines = [
    "jour;pages vues;visiteurs;fiches annonces vues",
    ...daily.map((d) => `${d.day};${d.pageViews};${d.visitors};${d.listingViews}`),
  ];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chcars-statistiques-${days}j.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminStatisticsPage() {
  const [days, setDays] = useState<AnalyticsPeriod>(30);
  const state = useAsync(() => analyticsService.summary(days), [days]);

  return (
    <section>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-2">
        <div>
          <h1 className="h3 mb-1">Statistiques</h1>
          <p className="text-secondary small mb-0">
            Audience du site, intérêt pour les annonces et état du catalogue.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 chc-stats-toolbar">
          <ButtonGroup size="sm" aria-label="Période">
            {ANALYTICS_PERIODS.map((period) => (
              <Button
                key={period}
                variant={period === days ? "primary" : "outline-secondary"}
                aria-pressed={period === days}
                onClick={() => setDays(period)}
              >
                {period} jours
              </Button>
            ))}
          </ButtonGroup>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={state.status !== "ready"}
            onClick={() => state.status === "ready" && downloadCsv(state.data.daily, days)}
          >
            Exporter (CSV)
          </Button>
        </div>
      </div>

      {state.status === "loading" && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" role="status" aria-label="Chargement" />
        </div>
      )}
      <ErrorAlert message={state.status === "error" ? state.error : undefined} />

      {state.status === "ready" && (
        <>
          <StatsReport data={state.data} />
          <p className="text-secondary small mt-4 mb-0">
            Seuls les visiteurs ayant accepté le cookie de mesure d&apos;audience sont comptés ;
            l&apos;administration n&apos;est jamais mesurée. Données conservées 13 mois. Les
            évolutions comparent la période à la même durée juste avant.
          </p>
        </>
      )}
    </section>
  );
}
