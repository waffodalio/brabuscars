import { createHash } from "node:crypto";

/** `001_init.sql` → version `001`, nom `init`. */
const MIGRATION_FILE = /^(\d{3})_([a-z0-9_]+)\.sql$/;

export interface MigrationFile {
  version: string;
  name: string;
  filename: string;
}

export interface AppliedMigration {
  version: string;
  checksum: string;
}

/**
 * Keeps the `NNN_name.sql` files, sorted by version. Any other `.sql` file or
 * duplicated version is a mistake in `db/migrations/` and aborts the run.
 */
export function parseMigrationFiles(filenames: string[]): MigrationFile[] {
  const migrations: MigrationFile[] = [];
  for (const filename of filenames) {
    if (!filename.endsWith(".sql")) continue;
    const match = MIGRATION_FILE.exec(filename);
    if (!match) {
      throw new Error(`nom de migration invalide : ${filename} (attendu : 001_nom.sql)`);
    }
    migrations.push({ version: match[1], name: match[2], filename });
  }
  migrations.sort((a, b) => a.version.localeCompare(b.version));
  for (let i = 1; i < migrations.length; i++) {
    if (migrations[i].version === migrations[i - 1].version) {
      throw new Error(`version de migration en double : ${migrations[i].version}`);
    }
  }
  return migrations;
}

/** SHA-256 of the file, line endings normalized (Windows checkout vs. Linux image). */
export function checksum(sql: string): string {
  return createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
}

/**
 * Returns the migrations still to apply. An applied migration that was edited
 * afterwards, or that is missing from the folder, is an error: a migration is
 * immutable once it has run somewhere — fix it with a new file instead.
 */
export function pendingMigrations<T extends MigrationFile & { checksum: string }>(
  files: T[],
  applied: AppliedMigration[],
): T[] {
  const byVersion = new Map(files.map((file) => [file.version, file]));
  for (const row of applied) {
    const file = byVersion.get(row.version);
    if (!file) {
      throw new Error(`migration ${row.version} appliquée en base mais absente de db/migrations/`);
    }
    if (file.checksum !== row.checksum) {
      throw new Error(
        `${file.filename} a été modifiée après avoir été appliquée — créer une nouvelle migration`,
      );
    }
  }
  const done = new Set(applied.map((row) => row.version));
  return files.filter((file) => !done.has(file.version));
}
