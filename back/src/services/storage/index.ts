import { env } from "../../config/env";
import { LocalDiskStorage } from "./LocalDiskStorage";
import type { StorageService } from "./StorageService";

export type { StorageService } from "./StorageService";

/** Listing images — `UPLOAD_DIR`, served publicly under `/uploads`. */
export const storage: StorageService = new LocalDiskStorage(env.UPLOAD_DIR);

/** Purchase orders / invoices — `DOCUMENTS_DIR`, private (admin download only). */
export const documentStorage: StorageService = new LocalDiskStorage(env.DOCUMENTS_DIR);
