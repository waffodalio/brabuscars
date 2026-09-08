import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { hashPassword } from "../utils/password";

/**
 * Bootstraps an administrator account (public registration only creates `user`
 * accounts). Runs against the environment selected by NODE_ENV.
 *
 *   npm run create-admin -- --email=a@b.fr --password=secret123 \
 *     --firstName=Alice --lastName=Martin
 *
 * If the email already exists, the account is promoted to `admin` (and its
 * password reset when `--password` is provided).
 */
function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(
    prefix.length,
  );
}

async function main(): Promise<void> {
  const email = arg("email");
  const password = arg("password");
  const firstName = arg("firstName") ?? "Admin";
  const lastName = arg("lastName") ?? "CHCars";

  if (!email || !password) {
    console.error(
      "Usage: npm run create-admin -- --email=<email> --password=<mot de passe> [--firstName=<x>] [--lastName=<y>]",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  await AppDataSource.initialize();
  try {
    const users = AppDataSource.getRepository(User);
    const existing = await users.findOneBy({ email });

    if (existing) {
      existing.role = "admin";
      existing.passwordHash = await hashPassword(password);
      await users.save(existing);
      console.log(`Utilisateur "${email}" promu administrateur.`);
    } else {
      await users.save(
        users.create({
          email,
          passwordHash: await hashPassword(password),
          firstName,
          lastName,
          role: "admin",
        }),
      );
      console.log(`Compte administrateur créé : "${email}".`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
