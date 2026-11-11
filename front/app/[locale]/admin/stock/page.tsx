"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { stockService } from "@/services/stockService";
import { STOCK_STATUSES, type StockStatus, type StockVehicle } from "@/types/stock";
import { errorMessage } from "@/utils/errors";
import { formatDay, formatEuros, todayIso } from "@/utils/saleLabels";
import { STOCK_STATUS_LABELS, STOCK_STATUS_VARIANTS, isInGarage, stockMatches } from "@/utils/stockLabels";

type Filter = "garage" | StockStatus | "all";

/** Past this many days at the garage, a car is flagged as « slow-moving ». */
const OLD_STOCK_DAYS = 90;

/** Back-office: the garage register — what is at the garage, what came in and went out. */
export default function AdminStockPage() {
  const { withLocale } = useLanguage();
  const [vehicles, setVehicles] = useState<StockVehicle[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("garage");
  const [search, setSearch] = useState("");

  useEffect(() => {
    stockService
      .list()
      .then(setVehicles)
      .catch((err: unknown) => {
        setError(errorMessage(err, "Erreur inconnue"));
        setVehicles([]);
      });
  }, []);

  const all = vehicles ?? [];
  const inGarage = all.filter((vehicle) => isInGarage(vehicle.status));
  const month = todayIso().slice(0, 7);
  const soldThisMonth = all.filter((vehicle) => vehicle.status === "sold" && vehicle.exitDate?.startsWith(month)).length;
  const stockValue = inGarage.reduce((sum, vehicle) => sum + (vehicle.totals.costPrice ?? 0), 0);
  const averageDays = inGarage.length
    ? Math.round(inGarage.reduce((sum, vehicle) => sum + vehicle.daysInStock, 0) / inGarage.length)
    : 0;

  const counts: Partial<Record<Filter, number>> = { garage: inGarage.length, all: all.length };
  for (const vehicle of all) counts[vehicle.status] = (counts[vehicle.status] ?? 0) + 1;

  const shown = all.filter(
    (vehicle) =>
      (filter === "all" || (filter === "garage" ? isInGarage(vehicle.status) : vehicle.status === filter)) &&
      stockMatches(vehicle, search),
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: "garage", label: "Au garage" },
    ...STOCK_STATUSES.map((status) => ({ key: status as Filter, label: STOCK_STATUS_LABELS[status] })),
    { key: "all", label: "Tous" },
  ];

  return (
    <section>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <p className="text-secondary mb-0 me-auto">
          Les véhicules gérés par le garage, avec ou sans annonce : entrées, frais, sorties.
        </p>
        <Link href={withLocale("/admin/stock/nouveau")} className="btn btn-primary">
          Entrer un véhicule
        </Link>
      </div>

      <ErrorAlert message={error} />

      {vehicles === null ? (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      ) : (
        <>
          <div className="chc-stock-kpis chc-stagger mb-4">
            <div className="chc-stock-kpi">
              <span>Au garage</span>
              <strong>{inGarage.length}</strong>
            </div>
            <div className="chc-stock-kpi">
              <span>Valeur du stock</span>
              <strong className="chc-num">{formatEuros(stockValue)}</strong>
              <small>prix de revient</small>
            </div>
            <div className="chc-stock-kpi">
              <span>Ancienneté moyenne</span>
              <strong>
                {averageDays} <small>j</small>
              </strong>
            </div>
            <div className="chc-stock-kpi">
              <span>Vendus ce mois</span>
              <strong>{soldThisMonth}</strong>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
            <div className="chc-segmented" role="group" aria-label="Statut">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={filter === tab.key ? "is-active" : undefined}
                  aria-pressed={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label}
                  {(counts[tab.key] ?? 0) > 0 && <span className="chc-tab-count">{counts[tab.key]}</span>}
                </button>
              ))}
            </div>
            <Form.Control
              type="search"
              size="sm"
              className="chc-sales-search"
              placeholder="Marque, modèle, VIN, n° de stock…"
              aria-label="Rechercher un véhicule"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {shown.length === 0 ? (
            <Alert variant="light" className="border">
              {all.length === 0
                ? "Aucun véhicule enregistré. Commencez avec « Entrer un véhicule »."
                : search.trim()
                  ? `Aucun véhicule ne correspond à « ${search.trim()} ».`
                  : "Aucun véhicule ici."}
            </Alert>
          ) : (
            <div className="chc-admin-table">
              <Table hover responsive className="align-middle mb-0 chc-table-cards">
                <thead>
                  <tr>
                    <th>Véhicule</th>
                    <th>Année · km</th>
                    <th>Entrée</th>
                    <th className="text-end">Revient / visé</th>
                    <th>Statut</th>
                    <th>Annonce</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td data-label="Véhicule">
                        <Link href={withLocale(`/admin/stock/${vehicle.id}`)} className="fw-semibold">
                          {vehicle.label}
                        </Link>
                        <div className="small text-secondary">
                          {[vehicle.reference, vehicle.vin].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td data-label="Année · km" className="text-nowrap">
                        {vehicle.year} · {vehicle.mileage.toLocaleString("fr-BE")} km
                      </td>
                      <td data-label="Entrée">
                        {formatDay(vehicle.entryDate)}
                        <div
                          className={`small ${
                            isInGarage(vehicle.status) && vehicle.daysInStock > OLD_STOCK_DAYS ? "text-danger fw-semibold" : "text-secondary"
                          }`}
                        >
                          {isInGarage(vehicle.status)
                            ? `${vehicle.daysInStock} j au garage`
                            : `sorti le ${formatDay(vehicle.exitDate ?? vehicle.entryDate)}`}
                        </div>
                      </td>
                      <td data-label="Revient / visé" className="text-end chc-num text-nowrap">
                        {vehicle.totals.costPrice !== null ? formatEuros(vehicle.totals.costPrice) : "—"}
                        <div className="small text-secondary">
                          {vehicle.targetPrice !== null ? formatEuros(vehicle.targetPrice) : "—"}
                        </div>
                      </td>
                      <td data-label="Statut">
                        <Badge bg={STOCK_STATUS_VARIANTS[vehicle.status]} text={vehicle.status === "preparation" ? "dark" : undefined}>
                          {STOCK_STATUS_LABELS[vehicle.status]}
                        </Badge>
                      </td>
                      <td data-label="Annonce">
                        {vehicle.listing ? (
                          <span className="small">{vehicle.listing.title}</span>
                        ) : isInGarage(vehicle.status) ? (
                          <Link href={withLocale(`/admin/annonces/nouvelle?stock=${vehicle.id}`)} className="small">
                            + Créer l&apos;annonce
                          </Link>
                        ) : (
                          <span className="small text-secondary">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
