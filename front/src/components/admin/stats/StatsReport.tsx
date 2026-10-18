"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { DailyViewsChart } from "@/components/admin/DailyViewsChart";
import { useLanguage } from "@/context/LanguageContext";
import type { AnalyticsSummary, Compared, SiteSection } from "@/types/analytics";
import { LISTING_STATUSES } from "@/types/listing";
import { LISTING_STATUS_LABELS, LISTING_STATUS_VARIANTS } from "@/utils/listingLabels";
import { BarList } from "./BarList";
import { Delta, StatTile } from "./StatTile";
import { TopListingsTable } from "./TopListingsTable";
import { WeekHourHeatmap } from "./WeekHourHeatmap";
import { formatNumber, formatPercent } from "./format";

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

const SECTION_LABELS: Record<SiteSection, string> = {
  home: "Accueil",
  listings: "Liste des annonces",
  listing: "Fiches annonces",
  contact: "Contact",
  account: "Compte (connexion, favoris…)",
  other: "Autres pages",
};

const LOCALE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "Anglais",
  nl: "Néerlandais",
  "": "Non précisée",
};

type Metric = "pageViews" | "visitors" | "listingViews";
const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: "pageViews", label: "Pages vues", unit: "pages vues" },
  { key: "visitors", label: "Visiteurs", unit: "visiteurs" },
  { key: "listingViews", label: "Fiches", unit: "fiches annonces vues" },
];

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

function Panel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="h-100 chc-stats-panel">
      <Card.Body>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
          <div className="me-auto">
            <Card.Title as="h4" className="h6 mb-0">{title}</Card.Title>
            {subtitle && <div className="small text-secondary">{subtitle}</div>}
          </div>
          {actions}
        </div>
        {children}
      </Card.Body>
    </Card>
  );
}

/** Small heading that splits the report into its two parts. */
function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="chc-stats-heading">{children}</h3>;
}

function EngagementRow({ label, figures, href }: { label: string; figures: Compared; href?: string }) {
  const { withLocale } = useLanguage();
  return (
    <li className="d-flex align-items-center justify-content-between gap-3 py-2 border-bottom">
      <span className="small">
        {href ? <Link href={withLocale(href)} className="text-reset">{label}</Link> : label}
      </span>
      <span className="d-flex flex-wrap justify-content-end align-items-baseline column-gap-2">
        <span className="fs-5 fw-semibold chc-num">{formatNumber(figures.current)}</span>
        <Delta current={figures.current} previous={figures.previous} />
      </span>
    </li>
  );
}

function AudienceSection({ data }: { data: AnalyticsSummary }) {
  const [metric, setMetric] = useState<Metric>("pageViews");
  const active = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  const perVisitor = ratio(data.pageViews, data.visitors);
  const previousPerVisitor = ratio(data.previous.pageViews, data.previous.visitors);
  const returning = data.visitors - data.newVisitors;

  return (
    <>
      <Row xs={1} sm={2} xl={4} className="g-3 mb-3">
        <Col>
          <StatTile
            label="Visiteurs uniques"
            value={formatNumber(data.visitors)}
            current={data.visitors}
            previous={data.previous.visitors}
            hint={`dont ${formatPercent(ratio(data.newVisitors, data.visitors))} de nouveaux`}
            trend={data.daily.map((d) => d.visitors)}
          />
        </Col>
        <Col>
          <StatTile
            label="Pages vues"
            value={formatNumber(data.pageViews)}
            current={data.pageViews}
            previous={data.previous.pageViews}
            hint={`${formatNumber(Math.round(data.pageViews / data.days))} par jour en moyenne`}
            trend={data.daily.map((d) => d.pageViews)}
          />
        </Col>
        <Col>
          <StatTile
            label="Fiches annonces vues"
            value={formatNumber(data.listingViews)}
            current={data.listingViews}
            previous={data.previous.listingViews}
            hint={`${formatPercent(ratio(data.listingViews, data.pageViews))} des pages vues`}
            trend={data.daily.map((d) => d.listingViews)}
          />
        </Col>
        <Col>
          <StatTile
            label="Pages par visiteur"
            value={perVisitor.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
            current={perVisitor}
            previous={previousPerVisitor}
            hint="Profondeur moyenne de visite"
          />
        </Col>
      </Row>

      {/*
        The side menu takes 260 px from lg up, so two columns only from xl.
        Below xl: chart, then sections | profile side by side, then heatmap.
      */}
      <Row className="g-3 mb-3">
        <Col xs={12} xl={8}>
          <Panel
            title="Évolution quotidienne"
            subtitle={`${data.days} derniers jours`}
            actions={
              <ButtonGroup size="sm" aria-label="Mesure affichée">
                {METRICS.map((m) => (
                  <Button
                    key={m.key}
                    variant={m.key === metric ? "secondary" : "outline-secondary"}
                    aria-pressed={m.key === metric}
                    onClick={() => setMetric(m.key)}
                  >
                    {m.label}
                  </Button>
                ))}
              </ButtonGroup>
            }
          >
            <DailyViewsChart
              data={data.daily.map((d) => ({ day: d.day, value: d[metric] }))}
              unit={active.unit}
            />
          </Panel>
        </Col>
        <Col md={6} xl={4}>
          <Panel title="Rubriques consultées" subtitle="Répartition des pages vues">
            <BarList
              total={data.pageViews}
              items={data.sections.map((s) => ({
                key: s.bucket,
                label: SECTION_LABELS[s.bucket] ?? s.bucket,
                value: s.views,
              }))}
            />
          </Panel>
        </Col>
        <Col xs={12} xl={8} className="order-last order-xl-0">
          <Panel title="Moments de visite" subtitle="Pages vues par jour et par heure">
            <WeekHourHeatmap grid={data.heatmap} timeZone={data.timeZone} />
          </Panel>
        </Col>
        <Col md={6} xl={4}>
          <Panel title="Profil des visiteurs">
            <div className="small fw-medium mb-2">Fidélité</div>
            <BarList
              total={data.visitors}
              items={[
                { key: "new", label: "Nouveaux visiteurs", value: data.newVisitors },
                { key: "returning", label: "Visiteurs de retour", value: returning },
              ]}
            />
            <div className="small fw-medium mt-4 mb-2">Langue du site</div>
            <BarList
              total={data.pageViews}
              items={data.locales.map((l) => ({
                key: l.bucket || "none",
                label: LOCALE_LABELS[l.bucket] ?? l.bucket.toUpperCase(),
                value: l.views,
              }))}
            />
          </Panel>
        </Col>
      </Row>

      <Panel title="Annonces les plus consultées" subtitle="Vues des fiches sur la période · favoris cumulés">
        <TopListingsTable rows={data.topListings} />
      </Panel>
    </>
  );
}

function BusinessSection({ data }: { data: AnalyticsSummary }) {
  const { withLocale } = useLanguage();
  const { catalog, engagement } = data;

  return (
    <Row className="g-3">
      <Col md={6} xl={4}>
        <Panel title="Engagement" subtitle="Comparé à la période précédente">
          <ul className="list-unstyled mb-0 chc-engagement">
            <EngagementRow label="Annonces ajoutées en favori" figures={engagement.favorites} />
            <EngagementRow label="Messages de contact reçus" figures={engagement.messages} href="/admin/messages" />
            <EngagementRow label="Comptes clients créés" figures={engagement.registrations} />
          </ul>
          {catalog.unhandledMessages > 0 && (
            <Link href={withLocale("/admin/messages")} className="d-inline-block small mt-3">
              {formatNumber(catalog.unhandledMessages)} message
              {catalog.unhandledMessages > 1 ? "s" : ""} en attente de traitement →
            </Link>
          )}
        </Panel>
      </Col>
      <Col md={6} xl={4}>
        <Panel title="Catalogue" subtitle="État actuel des annonces">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {LISTING_STATUSES.map((status) => (
              <span key={status} className="chc-status-chip">
                <Badge bg={LISTING_STATUS_VARIANTS[status]} className="me-2">
                  {formatNumber(catalog.byStatus[status] ?? 0)}
                </Badge>
                {LISTING_STATUS_LABELS[status]}
              </span>
            ))}
          </div>
          <div className="small fw-medium">
            Publiées sans aucune vue{" "}
            <span className="text-secondary fw-normal">({formatNumber(catalog.unseenCount)})</span>
          </div>
          {catalog.unseen.length === 0 ? (
            <p className="small text-secondary mb-0 mt-1">Toutes les annonces publiées ont été consultées.</p>
          ) : (
            <>
              <ul className="list-unstyled small mb-0 mt-1">
                {catalog.unseen.map((listing) => (
                  <li key={listing.listingId} className="d-flex align-items-center justify-content-between gap-2 py-1">
                    <span className="text-truncate">
                      {listing.title}{" "}
                      <span className="text-secondary">· {listing.brand} {listing.model}</span>
                    </span>
                    <Link href={withLocale(`/admin/annonces/${listing.listingId}/modifier`)} className="text-nowrap">
                      Modifier
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="small text-secondary mt-2 mb-0">Pistes : photos, prix, titre plus parlant.</p>
            </>
          )}
        </Panel>
      </Col>
      <Col md={12} xl={4}>
        <Panel title="Pages les plus vues">
          <BarList
            total={data.pageViews}
            empty="Aucune page vue sur la période."
            items={data.topPages.map((p) => ({ key: p.path, label: pageLabel(p.path), value: p.views }))}
          />
        </Panel>
      </Col>
    </Row>
  );
}

/** The whole statistics report for one period: audience, then activity and catalogue. */
export function StatsReport({ data }: { data: AnalyticsSummary }) {
  return (
    <>
      <SectionHeading>Audience</SectionHeading>
      {data.pageViews === 0 ? (
        <Alert variant="light" className="border text-center py-5 mb-0">
          Aucune visite mesurée sur les {data.days} derniers jours.
        </Alert>
      ) : (
        <AudienceSection data={data} />
      )}
      <SectionHeading>Activité &amp; catalogue</SectionHeading>
      <BusinessSection data={data} />
    </>
  );
}
