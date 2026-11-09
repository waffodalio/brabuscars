import type { Request, Response } from "express";
import {
  listSalesQuerySchema,
  saleDocumentParamSchema,
  saleIdParamSchema,
  saleInputSchema,
  salePaymentParamSchema,
  salePaymentSchema,
} from "../dto/sale.dto";
import { saleService } from "../services/sale.service";
import { actorOf } from "../utils/actor";
import { success } from "../utils/apiResponse";

/** HTTP layer for `/api/sales` (admin only, see the routes). */
export const saleController = {
  async list(req: Request, res: Response): Promise<void> {
    const { status } = listSalesQuerySchema.parse(req.query);
    res.status(200).json(success(await saleService.list(status)));
  },

  async get(req: Request, res: Response): Promise<void> {
    const { id } = saleIdParamSchema.parse(req.params);
    res.status(200).json(success(await saleService.get(id)));
  },

  async create(req: Request, res: Response): Promise<void> {
    const dto = saleInputSchema.parse(req.body);
    res.status(201).json(success(await saleService.create(actorOf(req), dto)));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = saleIdParamSchema.parse(req.params);
    const dto = saleInputSchema.parse(req.body);
    res.status(200).json(success(await saleService.update(id, dto)));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = saleIdParamSchema.parse(req.params);
    await saleService.remove(id);
    res.status(204).send();
  },

  async addPayment(req: Request, res: Response): Promise<void> {
    const { id } = saleIdParamSchema.parse(req.params);
    const dto = salePaymentSchema.parse(req.body);
    res.status(201).json(success(await saleService.addPayment(id, dto)));
  },

  async deletePayment(req: Request, res: Response): Promise<void> {
    const { id, paymentId } = salePaymentParamSchema.parse(req.params);
    res.status(200).json(success(await saleService.deletePayment(id, paymentId)));
  },

  /** The PDF itself (not the JSON envelope), never cached. */
  async document(req: Request, res: Response): Promise<void> {
    const { id, documentId } = saleDocumentParamSchema.parse(req.params);
    const { filename, data } = await saleService.documentFile(id, documentId);
    res
      .status(200)
      .type("application/pdf")
      .set("Content-Disposition", `attachment; filename="${filename}"`)
      .set("Cache-Control", "no-store")
      .send(data);
  },
};
