import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../config/env";

/**
 * Applies `db/schema.sql` to the database of the current environment.
 *
 *   npm run migrate           (NODE_ENV=development)
 *   npm run migrate:prod
 *
 * The schema uses `CREATE TABLE IF NOT EXISTS`, so re-running only adds
 * missing tables. Column changes on existing tables stay manual — apply the
 * ALTER statements from the bottom of `db/schema.sql` yourself.
 */
async function main(): Promise<void> {
  const schemaPath = path.resolve(__dirname, "..", "..", "db", "schema.sql");
  const sql = await readFile(schemaPath, "utf-8");

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
    const [before] = await connection.query<mysql.RowDataPacket[]>(
      "SHOW TABLES",
    );
    await connection.query(sql);
    const [after] = await connection.query<mysql.RowDataPacket[]>("SHOW TABLES");

    const names = after.map((row) => String(Object.values(row)[0])).sort();
    console.log(
      `[migrate] tables : ${before.length} → ${after.length}` +
        (after.length ? `  (${names.join(", ")})` : ""),
    );
    console.log("[migrate] terminé.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("[migrate]", err instanceof Error ? err.message : err);
  process.exit(1);
});
