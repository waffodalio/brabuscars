import type { EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { env } from "../config/env";
import type { SaleInputDto, SalePaymentDto } from "../dto/sale.dto";
import { Listing } from "../entities/Listing";
import { Sale, type SaleDocumentKind, type SaleStatus } from "../entities/Sale";
import { SaleDocument } from "../entities/SaleDocument";
import { SaleLine } from "../entities/SaleLine";
import { SalePayment } from "../entities/SalePayment";
import { listingRepository } from "../repositories/listing.repository";
import { saleDocumentRepository, saleRepository } from "../repositories/sale.repository";
import { ApiError } from "../utils/ApiError";
import type { Actor } from "../utils/actor";
import {
  afterPayment,
  canDeletePayment,
  documentFilename,
  documentNumber,
  fromCents,
  isEditable,
  paymentProblem,
  toCents,
  totalCents,
  vatBreakdown,
} from "../utils/saleRules";
import { toSaleResponse, type SaleResponse } from "../utils/saleResponse";
import { renderSaleDocumentPdf } from "./pdf/saleDocumentPdf";
import { documentStorage } from "./storage";

/** Calendar year in the dealership's time zone (numbering restarts each year). */
function currentYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "Europe/Brussels" }).format(now));
}

async function loadOrFail(id: number, manager?: EntityManager): Promise<Sale> {
  const sale = await saleRepository.findDetail(id, manager);
  if (!sale) throw ApiError.notFound(`Sale ${id} not found`);
  return sale;
}

async function assertListingExists(listingId: number | null | undefined): Promise<void> {
  if (listingId && !(await listingRepository.existsBy({ id: listingId }))) {
    throw ApiError.badRequest(`Listing ${listingId} does not exist`);
  }
}

/** Sale columns from the input (lines are handled apart). */
function saleFields(dto: SaleInputDto): Partial<Sale> {
  return {
    vatRegime: dto.vatRegime,
    listingId: dto.listingId ?? null,
    buyerName: dto.buyer.name,
    buyerCompany: dto.buyer.company ?? null,
    buyerVatNumber: dto.buyer.vatNumber ?? null,
    buyerAddress: dto.buyer.address ?? null,
    buyerPostalCode: dto.buyer.postalCode ?? null,
    buyerCity: dto.buyer.city ?? null,
    buyerCountry: dto.buyer.country ?? null,
    buyerEmail: dto.buyer.email ?? null,
    buyerPhone: dto.buyer.phone ?? null,
    vehicleVin: dto.vehicleVin ?? null,
    notes: dto.notes ?? null,
  };
}

function lineRows(saleId: number, dto: SaleInputDto): Partial<SaleLine>[] {
  return dto.lines.map((line, position) => ({
    saleId,
    position,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  }));
}

/**
 * Issues a purchase order or an invoice inside the caller's transaction:
 * reserves the next number, renders the PDF from the sale as it is now,
 * stores the file (private storage) and records the document. Returns the
 * document and its file key (to delete the file if the transaction fails).
 */
async function issueDocument(
  manager: EntityManager,
  sale: Sale,
  kind: SaleDocumentKind,
  paidCents: number,
  payments: SalePayment[],
): Promise<{ document: SaleDocument; storageKey: string }> {
  const year = currentYear();
  const seq = await saleRepository.nextDocumentSeq(manager, kind, year);
  const number = documentNumber(kind, year, seq);
  const issuedAt = new Date();
  const lines = [...sale.lines].sort((a, b) => a.position - b.position);
  const total = totalCents(lines);

  const pdf = await renderSaleDocumentPdf({
    kind,
    number,
    issuedAt,
    seller: {
      name: env.COMPANY_NAME,
      address: env.COMPANY_ADDRESS,
      postalCode: env.COMPANY_POSTAL_CODE,
      city: env.COMPANY_CITY,
      country: env.COMPANY_COUNTRY,
      phone: env.COMPANY_PHONE,
      email: env.COMPANY_EMAIL,
      vatNumber: env.COMPANY_VAT_NUMBER,
      iban: env.COMPANY_IBAN,
      bic: env.COMPANY_BIC,
    },
    buyer: {
      name: sale.buyerName,
      company: sale.buyerCompany,
      vatNumber: sale.buyerVatNumber,
      address: sale.buyerAddress,
      postalCode: sale.buyerPostalCode,
      city: sale.buyerCity,
      country: sale.buyerCountry,
      phone: sale.buyerPhone,
      email: sale.buyerEmail,
    },
    vehicleVin: sale.vehicleVin,
    lines: lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPriceCents: toCents(line.unitPrice),
    })),
    vatRegime: sale.vatRegime,
    totals: vatBreakdown(total, sale.vatRegime),
    paidCents,
    payments: payments.map((payment) => ({
      paidOn: payment.paidOn,
      method: payment.method,
      amountCents: toCents(payment.amount),
    })),
  });

  const storageKey = `sales/${sale.id}/${number}.pdf`;
  await documentStorage.save(storageKey, pdf);
  const document = await manager.getRepository(SaleDocument).save(
    manager.getRepository(SaleDocument).create({
      saleId: sale.id,
      kind,
      year,
      seq,
      number,
      total: fromCents(total),
      paid: fromCents(paidCents),
      storageKey,
      issuedAt,
    }),
  );
  return { document, storageKey };
}

/**
 * Back-office billing, independent from customer accounts: a sale file with
 * the buyer typed in, what is sold and the payments. Recording payments
 * drives it: an advance issues the purchase order (`ordered`), reaching the
 * total issues the final invoice (`paid`) and marks the linked listing sold.
 * Issued documents are frozen (numbered without gaps, never edited or
 * deleted); so are the payments they relied on.
 */
export const saleService = {
  async list(status?: SaleStatus): Promise<SaleResponse[]> {
    const rows = await saleRepository.findAllForList();
    return rows.filter((sale) => !status || sale.status === status).map(toSaleResponse);
  },

  async get(id: number): Promise<SaleResponse> {
    return toSaleResponse(await loadOrFail(id));
  },

  async create(actor: Actor, dto: SaleInputDto): Promise<SaleResponse> {
    await assertListingExists(dto.listingId);
    const id = await AppDataSource.transaction(async (manager) => {
      const sale = await manager.getRepository(Sale).save(
        manager.getRepository(Sale).create({ ...saleFields(dto), status: "draft", createdBy: actor.id }),
      );
      await manager.getRepository(SaleLine).insert(lineRows(sale.id, dto));
      return sale.id;
    });
    return toSaleResponse(await loadOrFail(id));
  },

  /** Replaces buyer, lines, regime and vehicle — only before any document. */
  async update(id: number, dto: SaleInputDto): Promise<SaleResponse> {
    await assertListingExists(dto.listingId);
    await AppDataSource.transaction(async (manager) => {
      const sale = await manager.getRepository(Sale).findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!sale) throw ApiError.notFound(`Sale ${id} not found`);
      if (!isEditable(sale.status)) {
        throw ApiError.conflict("A document has been issued: this sale can no longer be changed");
      }
      await manager.getRepository(Sale).update({ id }, saleFields(dto));
      await manager.getRepository(SaleLine).delete({ saleId: id });
      await manager.getRepository(SaleLine).insert(lineRows(id, dto));
    });
    return toSaleResponse(await loadOrFail(id));
  },

  /** Deletes a draft (no payment, no document yet). */
  async remove(id: number): Promise<void> {
    const sale = await loadOrFail(id);
    if (!isEditable(sale.status) || sale.payments.length > 0) {
      throw ApiError.conflict("Only a draft without payment can be deleted");
    }
    await saleRepository.delete({ id });
  },

  /**
   * Records a payment and issues what it calls for: the purchase order on a
   * first advance, the final invoice once everything is paid (then the
   * linked listing is marked sold). All in one transaction, the sale row
   * locked so concurrent payments can't both pass the "amount due" check.
   */
  async addPayment(id: number, dto: SalePaymentDto): Promise<SaleResponse> {
    let writtenFile: string | null = null;
    try {
      await AppDataSource.transaction(async (manager) => {
        const locked = await manager.getRepository(Sale).findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
        if (!locked) throw ApiError.notFound(`Sale ${id} not found`);
        const sale = await loadOrFail(id, manager);

        const total = totalCents(sale.lines);
        const paidBefore = sale.payments.reduce((sum, payment) => sum + toCents(payment.amount), 0);
        const amount = toCents(dto.amount);
        const problem = paymentProblem(sale.status, total, paidBefore, amount);
        if (problem) throw ApiError.badRequest(problem);

        const payment = await manager.getRepository(SalePayment).save(
          manager.getRepository(SalePayment).create({
            saleId: id,
            amount: dto.amount,
            paidOn: dto.paidOn,
            method: dto.method,
            reference: dto.reference ?? null,
            documentId: null,
          }),
        );

        const paid = paidBefore + amount;
        const next = afterPayment(sale.status, total, paid);
        if (next.issue) {
          const payments = [...sale.payments, payment].sort(
            (a, b) => a.paidOn.localeCompare(b.paidOn) || a.id - b.id,
          );
          const { document, storageKey } = await issueDocument(manager, sale, next.issue, paid, payments);
          writtenFile = storageKey;
          await manager.getRepository(SalePayment).update({ id: payment.id }, { documentId: document.id });
        }
        await manager.getRepository(Sale).update({ id }, { status: next.status });

        if (next.status === "paid" && sale.listingId) {
          await manager.getRepository(Listing).update({ id: sale.listingId }, { status: "sold" });
        }
      });
    } catch (err) {
      // The document row was rolled back: don't leave its file behind.
      if (writtenFile) await documentStorage.delete(writtenFile).catch(() => undefined);
      throw err;
    }
    return toSaleResponse(await loadOrFail(id));
  },

  /** Removes a mistyped payment — only one no document relies on. */
  async deletePayment(id: number, paymentId: number): Promise<SaleResponse> {
    await AppDataSource.transaction(async (manager) => {
      const sale = await manager.getRepository(Sale).findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!sale) throw ApiError.notFound(`Sale ${id} not found`);
      const payment = await manager.getRepository(SalePayment).findOneBy({ id: paymentId, saleId: id });
      if (!payment) throw ApiError.notFound(`Payment ${paymentId} not found`);
      if (!canDeletePayment(sale.status, payment.documentId)) {
        throw ApiError.conflict("This payment is recorded on an issued document and can't be removed");
      }
      await manager.getRepository(SalePayment).delete({ id: paymentId });
    });
    return toSaleResponse(await loadOrFail(id));
  },

  /** The PDF of an issued document. */
  async documentFile(id: number, documentId: number): Promise<{ filename: string; data: Buffer }> {
    const document = await saleDocumentRepository.findWithFile(id, documentId);
    if (!document) throw ApiError.notFound(`Document ${documentId} not found`);
    const vehicle = [...document.sale.lines].sort((a, b) => a.position - b.position)[0]?.description;
    return {
      filename: documentFilename(document.number, vehicle, document.sale.buyerName),
      data: await documentStorage.read(document.storageKey),
    };
  },
};
