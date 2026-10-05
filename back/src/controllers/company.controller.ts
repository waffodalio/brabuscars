import type { Request, Response } from "express";
import { env } from "../config/env";
import { success } from "../utils/apiResponse";

/**
 * Public company information — CHCars is a single dealership, so every
 * vehicle is at this one address. Values come from the environment.
 */
export const companyController = {
  get(_req: Request, res: Response): void {
    res.status(200).json(
      success({
        name: env.COMPANY_NAME,
        address: env.COMPANY_ADDRESS,
        postalCode: env.COMPANY_POSTAL_CODE,
        city: env.COMPANY_CITY,
        country: env.COMPANY_COUNTRY,
        phone: env.COMPANY_PHONE,
        email: env.COMPANY_EMAIL,
        hours: env.COMPANY_HOURS,
        instagramUrl: env.COMPANY_INSTAGRAM_URL ?? null,
        facebookUrl: env.COMPANY_FACEBOOK_URL ?? null,
      }),
    );
  },
};
