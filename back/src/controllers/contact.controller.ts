import type { Request, Response } from "express";
import {
  contactIdParamSchema,
  createContactMessageSchema,
  updateContactMessageSchema,
} from "../dto/contact.dto";
import { contactService } from "../services/contact.service";
import { success } from "../utils/apiResponse";

/**
 * HTTP layer for `/api/contact`. `POST /` is public (rate limited); the rest
 * is admin-only (route middleware).
 */
export const contactController = {
  async submit(req: Request, res: Response): Promise<void> {
    const dto = createContactMessageSchema.parse(req.body);
    await contactService.submit(dto);
    res.status(202).json(success({ received: true }));
  },

  async list(_req: Request, res: Response): Promise<void> {
    const messages = await contactService.list();
    res.status(200).json(success(messages));
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = contactIdParamSchema.parse(req.params);
    const dto = updateContactMessageSchema.parse(req.body);
    const message = await contactService.setHandled(id, dto);
    res.status(200).json(success(message));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = contactIdParamSchema.parse(req.params);
    await contactService.remove(id);
    res.status(204).send();
  },
};
