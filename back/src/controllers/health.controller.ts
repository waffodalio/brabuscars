import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { success } from "../utils/apiResponse";

/**
 * Liveness/readiness probe. Reports whether the API is up and whether the
 * database connection has been initialised.
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json(
    success({
      status: "ok",
      database: AppDataSource.isInitialized ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    }),
  );
}
