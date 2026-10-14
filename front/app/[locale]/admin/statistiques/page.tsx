"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { DailyViewsChart } from "@/components/admin/DailyViewsChart";
import { useLanguage } from "@/context/LanguageContext";
import { useAsync } from "@/hooks/useAsync";
import { analyticsService } from "@/services/analyticsService";
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from "@/types/analytics";

const PAGE_LABELS: Record<string, string> = {
  "/": "Accueil",
  "/annonces": "Liste des annonces",
  "/contact": "Contact",
  "/favoris": "Favoris",
  "/connexion": "Connexion",
  "/inscription": "Inscription",
};

function pageLabel(path: string): string {
  const listing = /^\/annonces\/(\d+)$/.exec(path);
  if (listing) return `Annonce n° ${listing[1]}`;
  return PAGE_LABELS[path] ?? path;
}

const formatNumber = (value: number) => value.toLocaleString("fr-FR");

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="text-secondary small">{label}</div>
        <div className="fs-2 fw-bold lh-sm mt-1">{value}</div>
      </Card.Body>
    </Card>
  );
}

export default function AdminStatisticsPage() {
  const { withLocale } = useLanguage();
  const [days, setDays] = useState<AnalyticsPeriod>(30);
  const state = useAsync(() => analyticsService.summary(days), [days]);

  return (
    <section>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h2 className="h5 mb-0">Statistiques d&apos;audience</h2>
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
      </div>
      <p className="text-secondary small mb-4">
        Seuls les visiteurs ayant accepté le cookie de mesure d&apos;audience sont
        comptés ; l&apos;administration n&apos;est jamais mesurée. Données conservées
        13 mois.
      </p>

      {state.status === "loading" && (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      )}
      <ErrorAlert message={state.status === "error" ? state.error : undefined} />

      {state.status === "ready" && state.data.pageViews === 0 && (
        <Alert variant="light" className="border text-center py-5">
          Aucune visite mesurée sur les {days} derniers jours.
        </Alert>
      )}

      {state.status === "ready" && state.data.pageViews > 0 && (
        <>
          <Row xs={1} md={3} className="g-3 mb-4">
            <Col>
              <StatTile label="Pages vues" value={formatNumber(state.data.pageViews)} />
            </Col>
            <Col>
              <StatTile label="Visiteurs uniques" value={formatNumber(state.data.visitors)} />
            </Col>
            <Col>
              <StatTile
                label="Pages par visiteur"
                value={(state.data.pageViews / state.data.visitors).toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}
              />
            </Col>
          </Row>

          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="h6">Pages vues par jour</Card.Title>
              <DailyViewsChart data={state.data.daily} />
            </Card.Body>
          </Card>

          <Row xs={1} lg={2} className="g-3">
            <Col>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title className="h6">Annonces les plus consultées</Card.Title>
                  {state.data.topListings.length === 0 ? (
                    <p className="text-secondary small mb-0">Aucune fiche annonce consultée.</p>
                  ) : (
                    <Table responsive size="sm" className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th scope="col">Annonce</th>
                          <th scope="col" className="text-end">Vues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.data.topListings.map((row) => (
                          <tr key={row.listingId}>
                            <td>
                              <Link href={withLocale(`/annonces/${row.listingId}`)}>{row.title}</Link>
                            </td>
                            <td className="text-end">{formatNumber(row.views)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title className="h6">Pages les plus vues</Card.Title>
                  <Table responsive size="sm" className="mb-0 align-middle">
                    <thead>
                      <tr>
                        <th scope="col">Page</th>
                        <th scope="col" className="text-end">Vues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.topPages.map((row) => (
                        <tr key={row.path}>
                          <td>{pageLabel(row.path)}</td>
                          <td className="text-end">{formatNumber(row.views)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </section>
  );
}
