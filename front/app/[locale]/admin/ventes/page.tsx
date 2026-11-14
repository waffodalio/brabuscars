"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Form from "react-bootstrap/Form";
import ProgressBar from "react-bootstrap/ProgressBar";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ADMIN_ICONS, AdminIcon } from "@/components/admin/AdminIcon";
import { SaleDocumentRegister } from "@/components/admin/SaleDocumentRegister";
import { DocumentChip, SaleStatusPill } from "@/components/admin/SaleChips";
import { useLanguage } from "@/context/LanguageContext";
import { saleService } from "@/services/saleService";
import { SALE_STATUSES, type Sale, type SaleStatus } from "@/types/sale";
import { errorMessage } from "@/utils/errors";
import { listingPath } from "@/utils/listingPath";
import { SALE_STATUS_LABELS, formatEuros, saleMatches } from "@/utils/saleLabels";

type Filter = SaleStatus | "all";

/** Sale files (the work in progress) and the two document registers, kept apart. */
const VIEWS = [
  { key: "files", label: "Dossiers" },
  { key: "invoice", label: "Factures" },
  { key: "order", label: "Bons de commande" },
] as const;
type View = (typeof VIEWS)[number]["key"];

/** « AM » for Alice Martin. */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

/** Back-office billing: the sale files and the two document registers. */
export default function AdminSalesPage() {
  const { withLocale } = useLanguage();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("files");

  useEffect(() => {
    saleService
      .list()
      .then(setSales)
      .catch((err: unknown) => {
        setError(errorMessage(err, "Erreur inconnue"));
        setSales([]);
      });
  }, []);

  const counts = (sales ?? []).reduce<Partial<Record<Filter, number>>>(
    (acc, sale) => ({ ...acc, [sale.status]: (acc[sale.status] ?? 0) + 1 }),
    { all: sales?.length ?? 0 },
  );
  const shown = (sales ?? []).filter(
    (sale) => (filter === "all" || sale.status === filter) && saleMatches(sale, search),
  );
  const documentCount = (kind: "order" | "invoice") =>
    (sales ?? []).reduce((n, sale) => n + sale.documents.filter((document) => document.kind === kind).length, 0);

  return (
    <section>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <p className="text-secondary mb-0 me-auto">
          Une avance génère le <strong>bon de commande</strong> ; le paiement du solde génère la{" "}
          <strong>facture</strong>.
        </p>
        <Link href={withLocale("/admin/ventes/nouvelle")} className="btn btn-primary chc-new-btn text-decoration-none ms-auto">
          <span className="chc-new-btn-icon" aria-hidden="true">
            <AdminIcon d={ADMIN_ICONS.plus} size={14} />
          </span>
          Nouveau dossier
        </Link>
      </div>

      <ErrorAlert message={error} />

      {sales === null ? (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      ) : (
        <>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <div className="chc-segmented chc-segmented--lg" role="tablist" aria-label="Vue">
              {VIEWS.map(({ key, label }) => {
                const count = key === "files" ? sales.length : documentCount(key);
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className={view === key ? "is-active" : undefined}
                    aria-selected={view === key}
                    onClick={() => setView(key)}
                  >
                    {label}
                    {count > 0 && <span className="chc-tab-count">{count}</span>}
                  </button>
                );
              })}
            </div>
            <div className="chc-search-field ms-md-auto">
              <AdminIcon d={ADMIN_ICONS.search} size={14} />
              <Form.Control
                type="search"
                size="sm"
                className="chc-sales-search"
                placeholder="N° de document, client, véhicule, VIN…"
                aria-label="Rechercher"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {view !== "files" ? (
            <SaleDocumentRegister sales={sales} kind={view} search={search} />
          ) : (
            <>
              <div className="chc-segmented mb-3" role="group" aria-label="Statut">
                {(["all", ...SALE_STATUSES] as Filter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={filter === key ? "is-active" : undefined}
                    aria-pressed={filter === key}
                    onClick={() => setFilter(key)}
                  >
                    {key === "all" ? "Tous" : SALE_STATUS_LABELS[key]}
                    {(counts[key] ?? 0) > 0 && <span className="chc-tab-count">{counts[key]}</span>}
                  </button>
                ))}
              </div>

              {shown.length === 0 ? (
                <Alert variant="light" className="border">
                  {sales.length === 0
                    ? "Aucun dossier pour le moment. Créez-en un avec « Nouveau dossier »."
                    : search.trim()
                      ? `Aucun dossier ne correspond à « ${search.trim()} ».`
                      : "Aucun dossier ici."}
                </Alert>
              ) : (
                <div className="chc-admin-table">
                  <Table hover responsive className="align-middle mb-0 chc-table-cards chc-sales-table">
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Acheteur</th>
                        <th>Véhicule</th>
                        <th className="chc-col-progress">Encaissement</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((sale) => {
                        const invoice = sale.documents.find((document) => document.kind === "invoice");
                        const order = sale.documents.find((document) => document.kind === "order");
                        const main = invoice ?? order;
                        const href = withLocale(`/admin/ventes/${sale.id}`);
                        const ratio = sale.totals.total > 0 ? (sale.totals.paid / sale.totals.total) * 100 : 0;
                        return (
                          <tr key={sale.id} className="chc-row-link" onClick={() => router.push(href)}>
                            <td data-label="Référence">
                              <Link href={href} className="text-decoration-none" onClick={(e) => e.stopPropagation()}>
                                {main ? (
                                  <DocumentChip kind={main.kind} number={main.number} />
                                ) : (
                                  <DocumentChip kind="draft" number="Brouillon" />
                                )}
                              </Link>
                              <div className="small text-secondary text-nowrap mt-1">
                                {invoice && order
                                  ? `suite de ${order.number}`
                                  : new Date(main?.issuedAt ?? sale.createdAt).toLocaleDateString("fr-BE")}
                              </div>
                            </td>
                            <td data-label="Acheteur">
                              <div className="d-flex align-items-center gap-2">
                                <span className="chc-initials" aria-hidden="true">
                                  {initials(sale.buyer.name)}
                                </span>
                                <div className="min-w-0">
                                  <div className="fw-semibold">{sale.buyer.name}</div>
                                  {sale.buyer.company && (
                                    <div className="text-secondary small">{sale.buyer.company}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td data-label="Véhicule" className="chc-col-vehicle">
                              <div className="text-truncate">{sale.lines[0]?.description ?? "—"}</div>
                              {sale.listing && (
                                <Link
                                  href={withLocale(listingPath(sale.listing))}
                                  className="small text-secondary text-decoration-none d-inline-flex align-items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <AdminIcon d={ADMIN_ICONS.external} size={11} />
                                  Voir l&apos;annonce
                                </Link>
                              )}
                            </td>
                            <td data-label="Encaissement" className="chc-col-progress">
                              <div className="d-flex justify-content-between gap-2 small">
                                <span className="chc-num fw-semibold">{formatEuros(sale.totals.paid)}</span>
                                <span className="chc-num text-secondary">/ {formatEuros(sale.totals.total)}</span>
                              </div>
                              <ProgressBar
                                now={ratio}
                                variant={sale.status === "paid" ? "success" : sale.status === "ordered" ? "warning" : "secondary"}
                                className="chc-pay-progress"
                                aria-label={`Encaissé à ${Math.round(ratio)} %`}
                              />
                              <div className="small text-secondary mt-1">
                                {sale.totals.due > 0 ? (
                                  <>
                                    Reste <span className="chc-num">{formatEuros(sale.totals.due)}</span>
                                  </>
                                ) : (
                                  "Soldé"
                                )}
                              </div>
                            </td>
                            <td data-label="Statut">
                              <SaleStatusPill status={sale.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
