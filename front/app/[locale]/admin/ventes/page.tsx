"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { useLanguage } from "@/context/LanguageContext";
import { saleService } from "@/services/saleService";
import { SALE_STATUSES, type Sale, type SaleStatus } from "@/types/sale";
import { errorMessage } from "@/utils/errors";
import { SALE_STATUS_LABELS, SALE_STATUS_VARIANTS, formatEuros } from "@/utils/saleLabels";

type Filter = SaleStatus | "all";

/** Back-office: sale files, the ones still awaiting payment first. */
export default function AdminSalesPage() {
  const { withLocale } = useLanguage();
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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
  const shown = (sales ?? []).filter((sale) => filter === "all" || sale.status === filter);
  const due = (sales ?? []).reduce((sum, sale) => sum + sale.totals.due, 0);

  return (
    <section>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <p className="text-secondary mb-0 me-auto">
          Une avance génère le <strong>bon de commande</strong> ; le paiement du solde génère la{" "}
          <strong>facture</strong>.
        </p>
        <Link href={withLocale("/admin/ventes/nouvelle")} className="btn btn-primary">
          Nouveau dossier
        </Link>
      </div>

      <ErrorAlert message={error} />

      {sales === null ? (
        <Spinner animation="border" role="status" aria-label="Chargement" />
      ) : (
        <>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
            <div className="chc-segmented" role="group" aria-label="Statut">
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
            {due > 0 && (
              <span className="ms-auto small text-secondary">
                Reste à encaisser : <strong className="text-body chc-num">{formatEuros(due)}</strong>
              </span>
            )}
          </div>

          {shown.length === 0 ? (
            <Alert variant="light" className="border">
              {sales.length === 0 ? "Aucun dossier pour le moment. Créez-en un avec « Nouveau dossier »." : "Aucun dossier ici."}
            </Alert>
          ) : (
            <div className="chc-admin-table">
            <Table hover responsive className="align-middle mb-0 chc-table-cards">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Acheteur</th>
                  <th>Véhicule</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Reste</th>
                  <th>Statut</th>
                  <th>Documents</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((sale) => (
                  <tr key={sale.id}>
                    <td data-label="N°">
                      <Link href={withLocale(`/admin/ventes/${sale.id}`)} className="fw-semibold">
                        #{sale.id}
                      </Link>
                    </td>
                    <td data-label="Acheteur">
                      <div>{sale.buyer.name}</div>
                      {sale.buyer.company && <div className="text-secondary small">{sale.buyer.company}</div>}
                    </td>
                    <td data-label="Véhicule" className="text-truncate" style={{ maxWidth: 260 }}>
                      {sale.lines[0]?.description ?? "—"}
                    </td>
                    <td data-label="Total" className="text-end chc-num">{formatEuros(sale.totals.total)}</td>
                    <td data-label="Reste" className="text-end chc-num">
                      {sale.totals.due > 0 ? formatEuros(sale.totals.due) : "—"}
                    </td>
                    <td data-label="Statut">
                      <Badge bg={SALE_STATUS_VARIANTS[sale.status]} text={sale.status === "ordered" ? "dark" : undefined}>
                        {SALE_STATUS_LABELS[sale.status]}
                      </Badge>
                    </td>
                    <td data-label="Documents" className="small text-secondary">
                      {sale.documents.length === 0
                        ? "—"
                        : sale.documents.map((document) => (
                            <div key={document.id} className="text-nowrap">
                              {document.number}
                            </div>
                          ))}
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
