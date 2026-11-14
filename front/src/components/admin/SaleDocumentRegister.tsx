"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Alert from "react-bootstrap/Alert";
import Table from "react-bootstrap/Table";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ADMIN_ICONS, AdminIcon } from "@/components/admin/AdminIcon";
import { DocumentChip } from "@/components/admin/SaleChips";
import { useLanguage } from "@/context/LanguageContext";
import { saleService } from "@/services/saleService";
import type { Sale, SaleDocumentKind } from "@/types/sale";
import { errorMessage } from "@/utils/errors";
import {
  documentMonth,
  documentRegister,
  documentYear,
  formatEuros,
  monthLabel,
  saleMatches,
  type RegisterEntry,
} from "@/utils/saleLabels";

/**
 * Register of one kind of document — the invoices (sales journal, what the
 * accountant asks for) or the purchase orders — kept apart from each other,
 * one row per issued document, grouped by month and filtered by year.
 */
export function SaleDocumentRegister({
  sales,
  kind,
  search,
}: {
  sales: Sale[];
  kind: SaleDocumentKind;
  /** Free text (document number, client, vehicle, VIN…), as on the sale files. */
  search: string;
}) {
  const { withLocale } = useLanguage();
  const [year, setYear] = useState<number | "all">("all");
  const [error, setError] = useState("");

  const entries = documentRegister(sales, kind);
  const years = [...new Set(entries.map((entry) => documentYear(entry.document.issuedAt)))].sort((a, b) => b - a);
  const shown = entries.filter(
    (entry) =>
      (year === "all" || documentYear(entry.document.issuedAt) === year) &&
      // Its own number counts, not the other documents of the same file.
      (entry.document.number.toLowerCase().includes(search.trim().toLowerCase()) ||
        saleMatches({ ...entry.sale, documents: [] }, search)),
  );
  const total = shown.reduce((sum, entry) => sum + entry.document.total, 0);
  const advances = shown.reduce((sum, entry) => sum + entry.document.paid, 0);
  const isInvoice = kind === "invoice";
  const columns = isInvoice ? 6 : 8;

  // Most recent month first, like the numbers.
  const months: { month: string; entries: RegisterEntry<Sale>[] }[] = [];
  for (const entry of shown) {
    const month = documentMonth(entry.document.issuedAt);
    const group = months.find((item) => item.month === month);
    if (group) group.entries.push(entry);
    else months.push({ month, entries: [entry] });
  }

  async function download(saleId: number, documentId: number, filename: string) {
    setError("");
    try {
      await saleService.downloadDocument(saleId, documentId, filename);
    } catch (err) {
      setError(errorMessage(err, "Téléchargement impossible"));
    }
  }

  if (entries.length === 0) {
    return (
      <Alert variant="light" className="border">
        {isInvoice
          ? "Aucune facture émise. Elle est générée au paiement du solde d'un dossier."
          : "Aucun bon de commande émis. Il est généré à la première avance d'un dossier."}
      </Alert>
    );
  }

  return (
    <>
      <ErrorAlert message={error} />
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        {years.length > 1 && (
          <div className="chc-segmented" role="group" aria-label="Année">
            {(["all", ...years] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={year === key ? "is-active" : undefined}
                aria-pressed={year === key}
                onClick={() => setYear(key)}
              >
                {key === "all" ? "Toutes" : key}
              </button>
            ))}
          </div>
        )}
        <div className="ms-auto d-flex flex-wrap gap-2">
          <span className="chc-register-total">
            <span className="text-secondary">
              {shown.length}{" "}
              {isInvoice ? (shown.length > 1 ? "factures" : "facture") : shown.length > 1 ? "bons" : "bon"}
            </span>
            <strong className="chc-num">{formatEuros(total)}</strong>
          </span>
          {!isInvoice && (
            <span className="chc-register-total">
              <span className="text-secondary">Acomptes</span>
              <strong className="chc-num">{formatEuros(advances)}</strong>
            </span>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <Alert variant="light" className="border">
          Aucun document ne correspond à la recherche.
        </Alert>
      ) : (
        <div className="chc-admin-table">
          <Table responsive className="align-middle mb-0 chc-table-cards chc-register-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Date</th>
                <th>Client</th>
                <th>Véhicule</th>
                <th className="text-end">{isInvoice ? "Montant TTC" : "Total"}</th>
                {!isInvoice && <th className="text-end">Acompte</th>}
                {!isInvoice && <th>Suite</th>}
                <th className="text-end">
                  <span className="visually-hidden">PDF</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((group) => (
                <Fragment key={group.month}>
                  <tr className="chc-register-month">
                    <td colSpan={columns}>
                      <div className="d-flex justify-content-between gap-3">
                        <span>{monthLabel(group.month)}</span>
                        <span className="chc-num chc-register-month-total">
                          {formatEuros(group.entries.reduce((sum, entry) => sum + entry.document.total, 0))}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.entries.map(({ sale, document, invoiceNumber, orderNumber }) => (
                    <tr key={document.id}>
                      <td data-label="N°">
                        <Link href={withLocale(`/admin/ventes/${sale.id}`)} className="text-decoration-none">
                          <DocumentChip kind={document.kind} number={document.number} />
                        </Link>
                        {isInvoice && orderNumber && (
                          <div className="small text-secondary text-nowrap mt-1">suite de {orderNumber}</div>
                        )}
                      </td>
                      <td data-label="Date" className="text-nowrap text-secondary">
                        {new Date(document.issuedAt).toLocaleDateString("fr-BE")}
                      </td>
                      <td data-label="Client">
                        <div className="fw-semibold text-nowrap">{sale.buyer.name}</div>
                        {sale.buyer.company && <div className="text-secondary small">{sale.buyer.company}</div>}
                      </td>
                      <td data-label="Véhicule" className="chc-col-vehicle">
                        <div className="text-truncate">{sale.lines[0]?.description ?? "—"}</div>
                      </td>
                      <td data-label={isInvoice ? "Montant TTC" : "Total"} className="text-end chc-num fw-semibold">
                        {formatEuros(document.total)}
                      </td>
                      {!isInvoice && (
                        <td data-label="Acompte" className="text-end chc-num">
                          {formatEuros(document.paid)}
                        </td>
                      )}
                      {!isInvoice && (
                        <td data-label="Suite">
                          {invoiceNumber ? (
                            <span className="small text-success-emphasis text-nowrap">Soldé · {invoiceNumber}</span>
                          ) : (
                            <span className="small text-warning-emphasis text-nowrap">En attente du solde</span>
                          )}
                        </td>
                      )}
                      <td data-label="" className="text-end">
                        <button
                          type="button"
                          className="chc-icon-btn"
                          onClick={() => void download(sale.id, document.id, document.filename)}
                          aria-label={`Télécharger ${document.number} (PDF)`}
                          title="Télécharger le PDF"
                        >
                          <AdminIcon d={ADMIN_ICONS.download} size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
