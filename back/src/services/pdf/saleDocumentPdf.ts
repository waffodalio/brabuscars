import PDFDocument from "pdfkit";
import type { PaymentMethod, SaleDocumentKind, VatRegime } from "../../entities/Sale";
import type { VatBreakdown } from "../../utils/saleRules";

export interface PdfParty {
  name: string;
  company?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface SaleDocumentPdfInput {
  kind: SaleDocumentKind;
  number: string;
  issuedAt: Date;
  seller: PdfParty & { iban?: string | null; bic?: string | null };
  buyer: PdfParty;
  vehicleVin: string | null;
  lines: { description: string; quantity: number; unitPriceCents: number }[];
  vatRegime: VatRegime;
  totals: VatBreakdown;
  paidCents: number;
  /** Listed on the invoice. */
  payments: { paidOn: string; method: PaymentMethod; amountCents: number }[];
}

const TITLES: Record<SaleDocumentKind, string> = { order: "BON DE COMMANDE", invoice: "FACTURE" };

const METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: "Virement",
  cash: "Espèces",
  card: "Carte",
  cheque: "Chèque",
  other: "Autre",
};

/** Legal mention of the margin scheme (Belgian VAT Code) — to be checked with the accountant. */
export const MARGIN_SCHEME_MENTION =
  "Régime particulier de taxation de la marge bénéficiaire — biens d'occasion (art. 58, § 4, du Code de la TVA). TVA non déductible par l'acheteur.";

const money = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });
/** The standard PDF fonts only cover Latin-1: swap the narrow no-break space Intl uses. */
const latin1 = (text: string) => text.replace(/ /g, " ");
const euros = (cents: number) => latin1(money.format(cents / 100));
const longDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-BE", { dateStyle: "long", timeZone: "Europe/Brussels" }).format(date);
const shortDay = (day: string) =>
  new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  );

const INK = "#1f2333";
const MUTED = "#6b7088";
const LINE = "#d9dbe6";
const ACCENT = "#4f46e5";

function partyLines(party: PdfParty): string[] {
  return [
    party.company ? `${party.company} — ${party.name}` : party.name,
    party.address ?? "",
    [party.postalCode, party.city].filter(Boolean).join(" "),
    party.country ?? "",
    party.vatNumber ? `TVA : ${party.vatNumber}` : "",
    [party.phone, party.email].filter(Boolean).join(" · "),
  ].filter(Boolean);
}

/**
 * Renders a purchase order or an invoice as an A4 PDF (standard fonts only,
 * no external resource). Pure: everything printed comes from `input`.
 */
export function renderSaleDocumentPdf(input: SaleDocumentPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: { Title: `${TITLES[input.kind]} ${input.number}`, Author: input.seller.name },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // --- Header: seller on the left, document title on the right -------------
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(18).text(input.seller.name, left, 50, { width: width / 2 });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    for (const line of partyLines({ ...input.seller, name: "" })) doc.text(line, { width: width / 2 });

    doc.font("Helvetica-Bold").fontSize(16).fillColor(ACCENT).text(TITLES[input.kind], left + width / 2, 50, { width: width / 2, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor(INK);
    doc.text(`N° ${input.number}`, { width: width / 2, align: "right" });
    doc.text(`Date : ${longDate(input.issuedAt)}`, { width: width / 2, align: "right" });

    // --- Buyer -----------------------------------------------------------------
    let y = 165;
    const boxX = left + width / 2;
    const buyer = partyLines(input.buyer);
    const boxHeight = 22 + buyer.length * 13;
    doc.roundedRect(boxX, y, width / 2, boxHeight, 6).strokeColor(LINE).stroke();
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("ACHETEUR", boxX + 12, y + 9);
    doc.font("Helvetica").fontSize(10).fillColor(INK);
    buyer.forEach((line, i) => doc.text(line, boxX + 12, y + 22 + i * 13, { width: width / 2 - 24 }));
    y += boxHeight + 25;

    if (input.vehicleVin) {
      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`N° de châssis (VIN) : ${input.vehicleVin}`, left, y);
      y += 18;
    }

    // --- Lines -------------------------------------------------------------------
    const cols = { desc: left + 8, qty: left + width * 0.6, unit: left + width * 0.68, total: left + width * 0.84 };
    const colW = { desc: width * 0.58 - 8, qty: width * 0.07, unit: width * 0.15, total: width * 0.16 - 8 };
    doc.rect(left, y, width, 22).fill("#f1f2f8");
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
    doc.text("DÉSIGNATION", cols.desc, y + 7, { width: colW.desc });
    doc.text("QTÉ", cols.qty, y + 7, { width: colW.qty, align: "right" });
    doc.text("PRIX UNIT. TVAC", cols.unit, y + 7, { width: colW.unit, align: "right" });
    doc.text("TOTAL TVAC", cols.total, y + 7, { width: colW.total, align: "right" });
    y += 22;

    doc.font("Helvetica").fontSize(10).fillColor(INK);
    for (const line of input.lines) {
      const height = Math.max(doc.heightOfString(line.description, { width: colW.desc }), 12) + 12;
      doc.text(line.description, cols.desc, y + 6, { width: colW.desc });
      doc.text(String(line.quantity), cols.qty, y + 6, { width: colW.qty, align: "right" });
      doc.text(euros(line.unitPriceCents), cols.unit, y + 6, { width: colW.unit, align: "right" });
      doc.text(euros(line.quantity * line.unitPriceCents), cols.total, y + 6, { width: colW.total, align: "right" });
      y += height;
      doc.moveTo(left, y).lineTo(right, y).strokeColor(LINE).lineWidth(0.5).stroke();
    }

    // --- Totals --------------------------------------------------------------------
    y += 12;
    const labelX = left + width * 0.5;
    const row = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 10).fillColor(INK);
      doc.text(label, labelX, y, { width: width * 0.3 });
      doc.text(value, labelX + width * 0.3, y, { width: width * 0.2, align: "right" });
      y += bold ? 18 : 15;
    };
    if (input.vatRegime === "standard") {
      row("Total HTVA", euros(input.totals.netCents));
      row("TVA 21 %", euros(input.totals.vatCents));
    }
    row("Total TVAC", euros(input.totals.totalCents), true);

    const due = input.totals.totalCents - input.paidCents;
    if (input.kind === "order") {
      row("Acompte versé", euros(input.paidCents));
      row("Reste à payer", euros(due), true);
    } else {
      row("Montant payé", euros(input.paidCents));
      row("Solde dû", euros(Math.max(due, 0)), true);
    }

    // --- Payments (invoice) ------------------------------------------------------------
    if (input.kind === "invoice" && input.payments.length > 0) {
      y += 10;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("PAIEMENTS REÇUS", left, y);
      y += 14;
      doc.font("Helvetica").fontSize(9).fillColor(INK);
      for (const payment of input.payments) {
        doc.text(`${shortDay(payment.paidOn)} · ${METHOD_LABELS[payment.method]}`, left, y, { width: width * 0.5 });
        doc.text(euros(payment.amountCents), left + width * 0.5, y, { width: width * 0.2, align: "right" });
        y += 13;
      }
      y += 4;
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#15803d").text("Facture acquittée.", left, y);
      y += 16;
    }

    // --- Mentions ------------------------------------------------------------------------
    y += 14;
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
    if (input.vatRegime === "margin") {
      doc.text(MARGIN_SCHEME_MENTION, left, y, { width });
      y = doc.y + 6;
    }
    if (input.kind === "order") {
      doc.text(
        "Le présent bon de commande confirme la vente du véhicule désigné ci-dessus, aux conditions indiquées. Le solde est payable au plus tard à la livraison. La facture définitive sera émise une fois le montant total réglé.",
        left,
        y,
        { width },
      );
      y = doc.y + 30;
      // Signatures
      const half = width / 2 - 10;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(INK);
      doc.text("Le vendeur", left, y, { width: half });
      doc.text("L'acheteur (« lu et approuvé »)", left + half + 20, y, { width: half });
      doc.roundedRect(left, y + 14, half, 60, 4).strokeColor(LINE).stroke();
      doc.roundedRect(left + half + 20, y + 14, half, 60, 4).strokeColor(LINE).stroke();
    }

    // --- Footer ----------------------------------------------------------------------------
    const bank = [
      input.seller.iban ? `IBAN ${input.seller.iban}` : "",
      input.seller.bic ? `BIC ${input.seller.bic}` : "",
    ].filter(Boolean);
    const footer = [input.seller.name, input.seller.vatNumber ? `TVA ${input.seller.vatNumber}` : "", ...bank]
      .filter(Boolean)
      .join("  ·  ");
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(footer, left, doc.page.height - 70, {
      width,
      align: "center",
      lineBreak: false,
    });

    doc.end();
  });
}
