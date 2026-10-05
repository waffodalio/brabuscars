import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { mfaService } from "../services/mfa.service";

/**
 * Removes the two-factor setup of an account (lost phone, lost recovery
 * codes). At its next login the account goes through 2FA enrollment again.
 * Runs against the environment selected by NODE_ENV.
 *
 *   npm run reset-mfa -- --email=a@b.fr
 *   (in the container: node dist/scripts/resetMfa.js --email=a@b.fr)
 */
function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((value) => value.startsWith(prefix))
    ?.slice(prefix.length);
}

async function main(): Promise<void> {
  const email = arg("email");
  if (!email) {
    console.error("Usage: npm run reset-mfa -- --email=<email>");
    process.exit(1);
  }

  await AppDataSource.initialize();
  try {
    const user = await AppDataSource.getRepository(User).findOneBy({ email });
    if (!user) {
      console.error(`Aucun compte "${email}".`);
      process.exitCode = 1;
      return;
    }
    await mfaService.reset(user.id);
    console.log(
      `Double authentification réinitialisée pour "${email}" : ` +
        "nouvel enrôlement à la prochaine connexion.",
    );
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
