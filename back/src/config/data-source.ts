import "reflect-metadata";
import path from "node:path";
import { DataSource } from "typeorm";
import { env, isProduction } from "./env";

/**
 * TypeORM connection for CHCars.
 *
 * IMPORTANT: `synchronize` and `migrationsRun` are always disabled. The
 * database schema is owned and managed manually by the project owner — this
 * application only maps existing tables through entities. Never enable schema
 * synchronization or run migrations automatically.
 */
export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  synchronize: false,
  migrationsRun: false,
  logging: isProduction ? ["error"] : ["error", "warn"],
  entities: [path.join(__dirname, "..", "entities", "*.{ts,js}")],
  migrations: [],
  subscribers: [],
});
