"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { DailyViewsChart } from "@/components/admin/DailyViewsChart";
import { useLanguage } from "@/context/LanguageContext";
import type { AnalyticsSummary, Compared, SiteSection } from "@/types/analytics";
import { LISTING_STATUSES } from "@/types/listing";
import { durationDays, sinceDays } from "@/utils/dayCount";
import { LISTING_STATUS_LABELS, LISTING_STATUS_VARIANTS } from "@/utils/listingLabels";
import { AdminIcon } from "../AdminIcon";
import { BarList } from "./BarList";
import { FunnelChart } from "./FunnelChart";
import { InterestPanel } from "./InterestPanel";
import { Delta, MiniBars, StatTile } from "./StatTile";
import { TopListingsTable } from "./TopListingsTable";
import { WeekHourHeatmap } from "./WeekHourHeatmap";
import {
  formatDecimal,
  formatDuration,
  formatEuros,
  formatNumber,
  formatPercent,
  ratio,
} from "./format";
import { STATS_ICONS as ICONS } from "./icons";

const PAGE_LABELS: Record<string, string> = {
  "/": "Accueil",
  "/annonces": "Liste des annonces",
  "/contact": "Contact",
  "/favoris": "Favoris",
  "/connexion": "Connexion",
  "/inscription": "Inscription",
  "/mon-compte": "Mon compte",
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

const PAGES_BUCKET_LABELS: Record<string, string> = {
  "1": "1 page (rebond)",
  "2": "2 pages",
  "3-5": "3 à 5 pages",
  "6+": "6 pages et plus",
};

const DURATION_BUCKET_LABELS: Record<string, string> = {
  "<10s": "Moins de 10 s",
  "10s-1m": "10 s à 1 min",
  "1-3m": "1 à 3 min",
  "3-10m": "3 à 10 min",
  "10m+": "Plus de 10 min",
};

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type Metric = "pageViews" | "visitors" | "visits" | "listingViews";
const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: "pageViews", label: "Pages vues", unit: "pages vues" },
  { key: "visitors", label: "Visiteurs", unit: "visiteurs" },
  { key: "visits", label: "Visites", unit: "visites" },
  { key: "listingViews", label: "Fiches", unit: "fiches annonces vues" },
];

const SECTIONS = [
  { id: "stats-overview", label: "Vue d'ensemble" },
  { id: "stats-visits", label: "Visites" },
  { id: "stats-listings", label: "Annonces" },
  { id: "stats-activity", label: "Activité & stock" },
];

function Panel({
  title,
  subtitle,
  icon,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="h-100 chc-stats-panel">
      <Card.Body>
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
          <div className="d-flex align-items-start gap-2 me-auto">
            {icon && (
              <span className="chc-panel-icon">
                <AdminIcon d={icon} size={15} />
              </span>
            )}
            <div>
              <Card.Title as="h4" className="h6 mb-0">{title}</Card.Title>
              {subtitle && <div className="small text-secondary">{subtitle}</div>}
            </div>
          </div>
          {actions}
        </div>
        {children}
      </Card.Body>
    </Card>
  );
}

/** Heading of one part of the report, an anchor of the section menu. */
function SectionHeading({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div id={id} className="chc-stats-section">
      <h3 className="chc-stats-heading">{title}</h3>
      {children && <p className="small text-secondary mb-0">{children}</p>}
    </div>
  );
}

/** Jump links to the parts of the report. */
function SectionNav() {
  return (
    <nav aria-label="Parties du rapport" className="chc-stats-nav">
      {SECTIONS.map((section) => (
        <a key={section.id} href={`#${section.id}`}>
          {section.label}
        </a>
      ))}
    </nav>
  );
}

/** Small figure inside a panel: label, value, optional hint. */
function MiniFigure({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  return (
    <div className="chc-mini-figure">
      <div className="small text-secondary">{label}</div>
      <div className="chc-mini-figure-value chc-num">{value}</div>
      {hint && <div className="small text-secondary">{hint}</div>}
    </div>
  );
}

function OverviewSection({ data }: { data: AnalyticsSummary }) {
  const [metric, setMetric] = useState<Metric>("pageViews");
  const active = METRICS.find((m) => m.key === metric) ?? METRICS[0];
  const { visits, previousVisits } = data;
  const bounceRate = ratio(visits.bounces, visits.visits);
  const previousBounceRate = ratio(previousVisits.bounces, previousVisits.visits);
  const pagesPerVisit = ratio(data.pageViews, visits.visits);
  const previousPagesPerVisit = ratio(data.previous.pageViews, previousVisits.visits);

  return (
    <>
      <Row xs={1} sm={2} xl={4} className="g-3 mb-3">
        <Col>
          <StatTile
            icon={ICONS.users}
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
            icon={ICONS.visits}
            label="Visites"
            value={formatNumber(visits.visits)}
            current={visits.visits}
            previous={previousVisits.visits}
            hint={`${formatDecimal(ratio(visits.visits, data.visitors))} visite(s) par visiteur`}
            trend={data.daily.map((d) => d.visits)}
          />
        </Col>
        <Col>
          <StatTile
            icon={ICONS.eye}
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
            icon={ICONS.listing}
            label="Fiches annonces vues"
            value={formatNumber(data.listingViews)}
            current={data.listingViews}
            previous={data.previous.listingViews}
            hint={`${formatPercent(ratio(data.listingViews, data.pageViews))} des pages vues`}
            trend={data.daily.map((d) => d.listingViews)}
          />
        </Col>
      </Row>

      <Row xs={2} xl={4} className="g-3 mb-3">
        <Col>
          <StatTile
            size="sm"
            icon={ICONS.bounce}
            label="Taux de rebond"
            value={formatPercent(bounceRate)}
            current={bounceRate}
            previous={previousBounceRate}
            mode="points"
            inverse
            hint="Visites d'une seule page"
          />
        </Col>
        <Col>
          <StatTile
            size="sm"
            icon={ICONS.clock}
            label="Durée moyenne"
            value={formatDuration(visits.averageSeconds)}
            current={visits.averageSeconds}
            previous={previousVisits.averageSeconds}
            hint="De la 1re à la dernière page"
          />
        </Col>
        <Col>
          <StatTile
            size="sm"
            icon={ICONS.layers}
            label="Pages par visite"
            value={formatDecimal(pagesPerVisit)}
            current={pagesPerVisit}
            previous={previousPagesPerVisit}
            hint="Profondeur de navigation"
          />
        </Col>
        <Col>
          <StatTile
            size="sm"
            icon={ICONS.userPlus}
            label="Nouveaux visiteurs"
            value={formatNumber(data.newVisitors)}
            hint={`${formatNumber(data.visitors - data.newVisitors)} visiteurs de retour`}
          />
        </Col>
      </Row>

      {/*
        The side menu takes 260 px from lg up, so two columns only from xl.
      */}
      <Row className="g-3">
        <Col xs={12} xl={8}>
          <Panel
            icon={ICONS.chart}
            title="Évolution quotidienne"
            subtitle={`${data.days} derniers jours · week-ends grisés`}
            actions={
              <div className="chc-segmented" role="group" aria-label="Mesure affichée">
                {METRICS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={m.key === metric ? "is-active" : undefined}
                    aria-pressed={m.key === metric}
                    onClick={() => setMetric(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            }
          >
            <DailyViewsChart
              unit={active.unit}
              data={data.daily.map((d) => ({
                day: d.day,
                value: d[metric],
                details: METRICS.filter((m) => m.key !== metric).map(
                  (m) => `${formatNumber(d[m.key])} ${m.unit}`,
                ),
              }))}
            />
          </Panel>
        </Col>
        <Col xs={12} xl={4}>
          <Panel icon={ICONS.funnel} title="Parcours des visiteurs" subtitle="Visiteurs uniques à chaque étape">
            <FunnelChart
              steps={[
                { key: "visitors", label: "Arrivent sur le site", value: data.funnel.visitors },
                { key: "browsed", label: "Parcourent les annonces", value: data.funnel.browsed },
                { key: "listing", label: "Ouvrent une fiche annonce", value: data.funnel.viewedListing },
                { key: "contact", label: "Vont sur la page contact", value: data.funnel.contact },
              ]}
            />
            <div className="chc-funnel-outcome small">
              <span className="text-secondary">Messages reçus sur la période</span>
              <span className="fw-semibold chc-num">{formatNumber(data.engagement.messages.current)}</span>
            </div>
          </Panel>
        </Col>
      </Row>
    </>
  );
}

function SectionsList({ data }: { data: AnalyticsSummary }) {
  return (
    <BarList
      total={data.pageViews}
      items={data.sections.map((s) => ({
        key: s.bucket,
        label: SECTION_LABELS[s.bucket] ?? s.bucket,
        value: s.views,
      }))}
    />
  );
}

function VisitsSection({ data }: { data: AnalyticsSummary }) {
  const { visits } = data;
  const weekdays = data.heatmap.map((row, day) => ({
    key: String(day),
    label: WEEKDAYS[day],
    value: row.reduce((sum, value) => sum + value, 0),
  }));
  const busiest = weekdays.reduce((best, day) => (day.value > best.value ? day : best), weekdays[0]);

  return (
    <Row className="g-3">
      <Col xs={12} xl={8}>
        <Panel icon={ICONS.calendar} title="Moments de visite" subtitle="Pages vues par jour et par heure">
          <WeekHourHeatmap grid={data.heatmap} timeZone={data.timeZone} />
        </Panel>
      </Col>
      <Col xs={12} md={6} xl={4}>
        <Panel
          icon={ICONS.calendar}
          title="Jours de la semaine"
          subtitle={busiest && busiest.value > 0 ? `Le plus fréquenté : ${busiest.label.toLowerCase()}` : undefined}
        >
          <BarList total={data.pageViews} items={weekdays} />
        </Panel>
      </Col>
      <Col xs={12} md={6} xl={4}>
        <Panel icon={ICONS.layers} title="Pages par visite" subtitle={`${formatNumber(visits.visits)} visites`}>
          <BarList
            total={visits.visits}
            items={visits.byPages.map((b) => ({
              key: b.bucket,
              label: PAGES_BUCKET_LABELS[b.bucket] ?? b.bucket,
              value: b.visits,
            }))}
          />
        </Panel>
      </Col>
      <Col xs={12} md={6} xl={4}>
        <Panel icon={ICONS.clock} title="Durée des visites" subtitle="De la 1re à la dernière page vue">
          <BarList
            total={visits.visits}
            items={visits.byDuration.map((b) => ({
              key: b.bucket,
              label: DURATION_BUCKET_LABELS[b.bucket] ?? b.bucket,
              value: b.visits,
            }))}
          />
        </Panel>
      </Col>
      <Col xs={12} md={6} xl={4}>
        <Panel icon={ICONS.door} title="Pages d'entrée" subtitle="Où commencent les visites">
          <BarList
            total={visits.visits}
            empty="Aucune visite sur la période."
            items={data.entryPages.map((p) => ({ key: p.path, label: pageLabel(p.path), value: p.views }))}
          />
        </Panel>
      </Col>
      <Col xs={12} md={6} xl={4}>
        <Panel icon={ICONS.compass} title="Rubriques consultées" subtitle="Répartition des pages vues">
          <SectionsList data={data} />
        </Panel>
      </Col>
      <Col xs={12} md={6} xl={4}>
        <Panel icon={ICONS.globe} title="Profil des visiteurs">
          <div className="small fw-medium mb-2">Fidélité</div>
          <BarList
            total={data.visitors}
            items={[
              { key: "new", label: "Nouveaux visiteurs", value: data.newVisitors },
              { key: "returning", label: "Visiteurs de retour", value: data.visitors - data.newVisitors },
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
      <Col xs={12} md={6} xl={4}>
        <Panel icon={ICONS.eye} title="Pages les plus vues">
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

function UnseenListings({ data }: { data: AnalyticsSummary }) {
  const { withLocale } = useLanguage();
  const { catalog } = data;
  if (catalog.unseen.length === 0) {
    return <p className="small text-secondary mb-0">Toutes les annonces publiées ont été consultées sur la période.</p>;
  }
  return (
    <>
      <ul className="list-unstyled small mb-0 chc-unseen">
        {catalog.unseen.map((listing) => (
          <li key={listing.listingId} className="d-flex align-items-center justify-content-between gap-2">
            <span className="text-truncate">
              <span className="fw-medium">{listing.title}</span>
              <span className="text-secondary"> · {listing.brand} {listing.model}</span>
            </span>
            <Link
              href={withLocale(`/admin/annonces/${listing.listingId}/modifier`)}
              className="btn btn-sm btn-outline-secondary text-nowrap"
            >
              Modifier
            </Link>
          </li>
        ))}
      </ul>
      {catalog.unseenCount > catalog.unseen.length && (
        <p className="small text-secondary mt-2 mb-0">
          … et {formatNumber(catalog.unseenCount - catalog.unseen.length)} autre(s).
        </p>
      )}
      <p className="small text-secondary mt-3 mb-0">Pistes : photos, prix, titre plus parlant.</p>
    </>
  );
}

function ListingsSection({ data }: { data: AnalyticsSummary }) {
  return (
    <Row className="g-3">
      <Col xs={12}>
        <Panel
          icon={ICONS.trophy}
          title="Annonces les plus consultées"
          subtitle="Vues des fiches sur la période · favoris cumulés"
        >
          <TopListingsTable rows={data.topListings} />
        </Panel>
      </Col>
      <Col xs={12} lg={7}>
        <Panel
          icon={ICONS.target}
          title="Ce qui intéresse les visiteurs"
          subtitle="Vues des fiches annonces, visiteurs distincts"
        >
          <InterestPanel interest={data.interest} total={data.listingViews} />
        </Panel>
      </Col>
      <Col xs={12} lg={5}>
        <Panel
          icon={ICONS.alert}
          title="Annonces à relancer"
          subtitle={`Publiées sans aucune vue sur la période (${formatNumber(data.catalog.unseenCount)})`}
        >
          <UnseenListings data={data} />
        </Panel>
      </Col>
    </Row>
  );
}

function EngagementRow({
  label,
  figures,
  trend,
  href,
}: {
  label: string;
  figures: Compared;
  trend: number[];
  href?: string;
}) {
  const { withLocale } = useLanguage();
  return (
    <li className="chc-engagement-row">
      <div style={{ minWidth: 0 }}>
        <div className="small">
          {href ? <Link href={withLocale(href)} className="text-reset">{label}</Link> : label}
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="fs-4 fw-bold chc-num">{formatNumber(figures.current)}</span>
          <Delta current={figures.current} previous={figures.previous} />
        </div>
      </div>
      <div className="chc-engagement-spark">
        <MiniBars values={trend} />
      </div>
    </li>
  );
}

function ActivitySection({ data }: { data: AnalyticsSummary }) {
  const { withLocale } = useLanguage();
  const { catalog, engagement, activity } = data;
  const { stock } = catalog;

  return (
    <Row className="g-3">
      <Col xs={12} md={6} xl={5}>
        <Panel icon={ICONS.activity} title="Engagement" subtitle="Comparé à la période précédente">
          <ul className="list-unstyled mb-0">
            <EngagementRow
              label="Annonces ajoutées en favori"
              figures={engagement.favorites}
              trend={activity.map((d) => d.favorites)}
            />
            <EngagementRow
              label="Messages de contact reçus"
              figures={engagement.messages}
              trend={activity.map((d) => d.messages)}
              href="/admin/messages"
            />
            <EngagementRow
              label="Comptes clients créés"
              figures={engagement.registrations}
              trend={activity.map((d) => d.registrations)}
            />
          </ul>
          {catalog.unhandledMessages > 0 && (
            <Link href={withLocale("/admin/messages")} className="chc-callout small mt-3">
              <AdminIcon d={ICONS.alert} size={14} />
              {formatNumber(catalog.unhandledMessages)} message
              {catalog.unhandledMessages > 1 ? "s" : ""} en attente de traitement →
            </Link>
          )}
        </Panel>
      </Col>
      <Col xs={12} md={6} xl={7}>
        <Panel icon={ICONS.box} title="Stock en ligne" subtitle="Annonces publiées, à l'instant">
          <div className="chc-mini-figures mb-3">
            <MiniFigure label="Annonces en ligne" value={formatNumber(stock.count)} />
            <MiniFigure label="Prix moyen" value={stock.count > 0 ? formatEuros(stock.averagePrice) : "—"} />
            <MiniFigure label="Valeur du stock" value={stock.count > 0 ? formatEuros(stock.totalValue, true) : "—"} />
            <MiniFigure
              label="En ligne depuis"
              value={stock.count > 0 ? durationDays(stock.averageDaysOnline) : "—"}
              hint={
                stock.count > 0
                  ? `en moyenne · la plus ancienne depuis ${sinceDays(stock.maxDaysOnline)}`
                  : undefined
              }
            />
          </div>
          <div className="small fw-medium mb-2">Toutes les annonces par statut</div>
          <div className="d-flex flex-wrap gap-2">
            {LISTING_STATUSES.map((status) => (
              <span key={status} className="chc-status-chip">
                <Badge bg={LISTING_STATUS_VARIANTS[status]} className="me-2">
                  {formatNumber(catalog.byStatus[status] ?? 0)}
                </Badge>
                {LISTING_STATUS_LABELS[status]}
              </span>
            ))}
          </div>
          {stock.withoutPhoto > 0 && (
            <Link href={withLocale("/admin/annonces")} className="chc-callout small mt-3">
              <AdminIcon d={ICONS.alert} size={14} />
              {formatNumber(stock.withoutPhoto)} annonce{stock.withoutPhoto > 1 ? "s" : ""} en ligne sans
              photo →
            </Link>
          )}
        </Panel>
      </Col>
    </Row>
  );
}

/** The whole statistics report for one period. */
export function StatsReport({ data }: { data: AnalyticsSummary }) {
  const noAudience = data.pageViews === 0;
  return (
    <>
      <SectionNav />
      <SectionHeading id="stats-overview" title="Vue d'ensemble">
        Audience du site sur les {data.days} derniers jours, comparée aux {data.days} jours précédents.
      </SectionHeading>
      {noAudience ? (
        <Alert variant="light" className="border text-center py-5 mb-0">
          Aucune visite mesurée sur les {data.days} derniers jours.
        </Alert>
      ) : (
        <OverviewSection data={data} />
      )}

      {!noAudience && (
        <>
          <SectionHeading id="stats-visits" title="Visites">
            Une visite se termine après 30 minutes sans nouvelle page.
          </SectionHeading>
          <VisitsSection data={data} />

          <SectionHeading id="stats-listings" title="Annonces">
            Quelles annonces et quels véhicules attirent les visiteurs.
          </SectionHeading>
          <ListingsSection data={data} />
        </>
      )}

      <SectionHeading id="stats-activity" title="Activité & stock" />
      <ActivitySection data={data} />
    </>
  );
}
