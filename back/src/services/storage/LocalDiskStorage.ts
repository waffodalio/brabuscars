import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";
import type { StorageService } from "./StorageService";

const ROOT = path.resolve(env.UPLOAD_DIR);

/** Resolves a key inside the upload root, rejecting path-traversal attempts. */
function resolveInRoot(key: string): string {
  const target = path.resolve(ROOT, key);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
  return target;
}

export class LocalDiskStorage implements StorageService {
  async save(key: string, data: Buffer): Promise<void> {
    const target = resolveInRoot(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  }

  async delete(key: string): Promise<void> {
    await rm(resolveInRoot(key), { force: true });
  }
}
