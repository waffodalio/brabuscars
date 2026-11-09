import { Router } from "express";
import { saleController } from "../controllers/sale.controller";
import { adminOnly } from "../middlewares/authenticate";

/**
 * `/api/sales` — back-office billing, admin only.
 *   GET    /?status=                      sale files
 *   POST   /                              new sale (draft)
 *   GET    /:id                           one sale (lines, payments, documents)
 *   PUT    /:id                           replace buyer / lines / regime (draft only)
 *   DELETE /:id                           delete a draft
 *   POST   /:id/payments                  record a payment → purchase order / invoice
 *   DELETE /:id/payments/:paymentId       remove a payment no document relies on
 *   GET    /:id/documents/:documentId/pdf download an issued document
 */
export const saleRouter = Router();

saleRouter.use(...adminOnly);
saleRouter.get("/", saleController.list);
saleRouter.post("/", saleController.create);
saleRouter.get("/:id", saleController.get);
saleRouter.put("/:id", saleController.update);
saleRouter.delete("/:id", saleController.remove);
saleRouter.post("/:id/payments", saleController.addPayment);
saleRouter.delete("/:id/payments/:paymentId", saleController.deletePayment);
saleRouter.get("/:id/documents/:documentId/pdf", saleController.document);
