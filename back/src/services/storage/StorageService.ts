/**
 * Where image files live. The local-disk implementation is the default; an
 * S3 / R2 adapter can be dropped in later without touching callers.
 */
export interface StorageService {
  /** Writes `data` under `key` (creating parent directories as needed). */
  save(key: string, data: Buffer): Promise<void>;
  /** Removes the file at `key`. Missing files are not an error. */
  delete(key: string): Promise<void>;
}
