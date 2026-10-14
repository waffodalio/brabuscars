import { createApp } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./config/data-source";
import { analyticsService } from "./services/analytics.service";

/** Grace period for in-flight requests on shutdown before forcing exit. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Drops audience-measurement rows past their retention period (13 months). */
function purgeExpiredPageViews(): void {
  if (!AppDataSource.isInitialized) return;
  analyticsService
    .purgeExpired()
    .then((count) => {
      if (count > 0) console.log(`[analytics] purged ${count} expired page views`);
    })
    .catch((err: unknown) => console.error("[analytics] purge failed", err));
}

/**
 * Process entry point: initialise the database connection, then start the
 * HTTP server. If the database is unreachable the server still starts so the
 * API surface can be exercised, but the failure is logged loudly.
 */
async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log("[db] connection established");
  } catch (err) {
    console.error(
      "[db] could not connect — the API will run without database access",
    );
    console.error(err);
  }

  const app = createApp();

  purgeExpiredPageViews();
  setInterval(purgeExpiredPageViews, ONE_DAY_MS).unref();

  // Express 5 passes a listen failure (e.g. port already in use) to the callback.
  const server = app.listen(env.PORT, (err?: Error) => {
    if (err) {
      console.error(`[http] could not listen on port ${env.PORT}`, err);
      process.exit(1);
    }
    console.log(
      `[http] CHCars API listening on http://localhost:${env.PORT}${env.API_PREFIX}`,
    );
  });

  // `docker compose down` / redeploy sends SIGTERM: finish in-flight requests,
  // close the DB pool, then exit.
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[http] ${signal} received, shutting down`);
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    server.close(() => {
      const closeDb = AppDataSource.isInitialized
        ? AppDataSource.destroy()
        : Promise.resolve();
      closeDb
        .catch((err: unknown) => console.error("[db] error while closing", err))
        .finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

process.on("unhandledRejection", (reason) => {
  console.error("[process] unhandled promise rejection", reason);
});

// State is unknown after an uncaught exception: log it and let the
// container restart policy bring up a clean process.
process.on("uncaughtException", (err) => {
  console.error("[process] uncaught exception", err);
  process.exit(1);
});

void bootstrap();
