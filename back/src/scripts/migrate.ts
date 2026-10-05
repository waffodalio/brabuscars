import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../config/env";
import {
  type AppliedMigration,
  checksum,
  parseMigrationFiles,
  pendingMigrations,
} from "../utils/migrations";

/**
 * Applies the pending files of `db/migrations/` (`NNN_name.sql`, in order) to
 * the database of the current environment, and records each one in
 * `schema_migrations`.
 *
 *   npm run migrate           (NODE_ENV=development)
 *   npm run migrate:test / migrate:prod
 *
 * Stops at the first error (non-zero exit, so a deployment fails instead of
 * starting an API on a half-migrated schema). MariaDB commits each DDL
 * statement immediately: a failed migration is not rolled back, fix the
 * database by hand before re-running.
 */
const MIGRATIONS_DIR = path.resolve(__dirname, "..", "..", "db", "migrations");
const LOCK_NAME = "chcars_migrate";

async function main(): Promise<void> {
  const files = await Promise.all(
    parseMigrationFiles(await readdir(MIGRATIONS_DIR)).map(async (file) => {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file.filename), "utf-8");
      return { ...file, sql, checksum: checksum(sql) };
    }),
  );

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    multipleStatements: true,
  });

  console.log(
    `[migrate] ${env.NODE_ENV} → ${env.DB_USERNAME}@${env.DB_HOST}/${env.DB_DATABASE}`,
  );

  try {
    // Deux déploiements simultanés ne doivent pas migrer en même temps.
    const [[lock]] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT GET_LOCK(?, 60) AS acquired",
      [LOCK_NAME],
    );
    if (lock.acquired !== 1) {
      throw new Error("une autre migration est en cours (verrou non obtenu en 60 s)");
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`version\`    VARCHAR(10)  NOT NULL,
        \`name\`       VARCHAR(255) NOT NULL,
        \`checksum\`   CHAR(64)     NOT NULL,
        \`applied_at\` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`version\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT version, checksum FROM schema_migrations ORDER BY version",
    );
    const applied = rows as AppliedMigration[];
    const pending = pendingMigrations(files, applied);

    if (pending.length === 0) {
      console.log(`[migrate] à jour (${applied.length} migration(s) appliquée(s)).`);
      return;
    }

    for (const file of pending) {
      console.log(`[migrate] → ${file.filename}`);
      await connection.query(file.sql);
      await connection.query(
        "INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)",
        [file.version, file.name, file.checksum],
      );
    }
    console.log(`[migrate] terminé : ${pending.length} migration(s) appliquée(s).`);
  } finally {
    await connection.end(); // libère aussi le verrou
  }
}

main().catch((err) => {
  console.error("[migrate]", err instanceof Error ? err.message : err);
  process.exit(1);
});
