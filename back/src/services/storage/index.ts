import { LocalDiskStorage } from "./LocalDiskStorage";
import type { StorageService } from "./StorageService";

export type { StorageService } from "./StorageService";

/** Process-wide storage backend. Swap the implementation here for S3 / R2. */
export const storage: StorageService = new LocalDiskStorage();
