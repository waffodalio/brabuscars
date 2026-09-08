import { Router } from "express";
import { companyController } from "../controllers/company.controller";

/** `/api/company` — public company / contact information. */
export const companyRouter = Router();

companyRouter.get("/", companyController.get);
