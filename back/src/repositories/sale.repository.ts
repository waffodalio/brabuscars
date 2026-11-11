import type { EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Sale, type SaleDocumentKind } from "../entities/Sale";
import { SaleDocument } from "../entities/SaleDocument";

const DETAIL_RELATIONS = { lines: true, payments: true, documents: true, listing: true, stockVehicle: { model: { brand: true } } } as const;
const DETAIL_ORDER = {
  lines: { position: "ASC" },
  payments: { paidOn: "ASC", id: "ASC" },
  documents: { issuedAt: "ASC" },
} as const;

/** Data-access layer for {@link Sale} and its lines, payments and documents. */
export const saleRepository = AppDataSource.getRepository(Sale).extend({
  findDetail(id: number, manager?: EntityManager): Promise<Sale | null> {
    const repo = manager ? manager.getRepository(Sale) : this;
    return repo.findOne({ where: { id }, relations: DETAIL_RELATIONS, order: DETAIL_ORDER });
  },

  /** Every sale with what the list needs (lines and payments for the totals). */
  findAllForList(): Promise<Sale[]> {
    return this.find({
      relations: { lines: true, payments: true, documents: true, listing: true, stockVehicle: { model: { brand: true } } },
      order: { createdAt: "DESC" },
    });
  },

  /** Numbers of the documents issued for sales of this listing (empty: none). */
  async documentNumbersForListing(listingId: number): Promise<string[]> {
    const rows = await this.createQueryBuilder("sale")
      .innerJoin("sale.documents", "document")
      .select("document.number", "number")
      .where("sale.listing_id = :listingId", { listingId })
      .orderBy("document.issued_at", "ASC")
      .getRawMany<{ number: string }>();
    return rows.map((row) => row.number);
  },

  /**
   * Next number of `kind` for `year`, reserved inside the caller's
   * transaction: the counter row is incremented atomically (and created on
   * the first document of the year), so a rolled-back transaction gives its
   * number back — no gap, no duplicate, even with concurrent requests.
   */
  async nextDocumentSeq(manager: EntityManager, kind: SaleDocumentKind, year: number): Promise<number> {
    await manager.query(
      "INSERT INTO document_counter (kind, year, last_seq) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE last_seq = last_seq + 1",
      [kind, year],
    );
    const [row] = (await manager.query(
      "SELECT last_seq AS seq FROM document_counter WHERE kind = ? AND year = ?",
      [kind, year],
    )) as { seq: number | string }[];
    return Number(row.seq);
  },
});

export const saleDocumentRepository = AppDataSource.getRepository(SaleDocument).extend({
  /** A document of this sale, with its (normally hidden) storage key and its sale (lines). */
  findWithFile(saleId: number, documentId: number): Promise<SaleDocument | null> {
    return this.createQueryBuilder("document")
      .addSelect("document.storageKey")
      .innerJoinAndSelect("document.sale", "sale")
      .leftJoinAndSelect("sale.lines", "line")
      .where("document.id = :documentId AND document.sale_id = :saleId", { documentId, saleId })
      .orderBy("line.position", "ASC")
      .getOne();
  },
});
