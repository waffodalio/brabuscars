import type { SaleDocumentKind, SaleStatus } from "@/types/sale";
import { SALE_STATUS_LABELS } from "@/utils/saleLabels";

/** Number of a purchase order (amber), an invoice (indigo) or « Brouillon » (grey). */
export function DocumentChip({ kind, number }: { kind: SaleDocumentKind | "draft"; number: string }) {
  return <span className={`chc-doc-chip chc-doc-chip--${kind} chc-doc-chip--lg`}>{number}</span>;
}

const STATUS_TONES: Record<SaleStatus, string> = {
  draft: "secondary",
  ordered: "warning",
  paid: "success",
};

/** Status of a sale file: soft pill with a dot, in the tone of its payment bar. */
export function SaleStatusPill({ status }: { status: SaleStatus }) {
  const tone = STATUS_TONES[status];
  return (
    <span className={`chc-status-pill text-${tone}-emphasis bg-${tone}-subtle border border-${tone}-subtle`}>
      <span className={`chc-status-dot bg-${tone}`} aria-hidden="true" />
      {SALE_STATUS_LABELS[status]}
    </span>
  );
}
