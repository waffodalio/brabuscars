import { createApp } from "./app";
import { env } from "./config/env";
import { AppDataSource } from "./config/data-source";

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

  app.listen(env.PORT, () => {
    console.log(
      `[http] CHCars API listening on http://localhost:${env.PORT}${env.API_PREFIX}`,
    );
  });
}

void bootstrap();
