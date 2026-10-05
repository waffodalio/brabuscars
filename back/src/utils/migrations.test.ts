import { describe, expect, it } from "vitest";
import { checksum, parseMigrationFiles, pendingMigrations } from "./migrations";

describe("parseMigrationFiles", () => {
  it("trie par version et ignore les fichiers non SQL", () => {
    const files = parseMigrationFiles(["002_add_x.sql", "README.md", "001_init.sql"]);
    expect(files.map((f) => f.filename)).toEqual(["001_init.sql", "002_add_x.sql"]);
    expect(files[1]).toMatchObject({ version: "002", name: "add_x" });
  });

  it("rejette un nom invalide", () => {
    expect(() => parseMigrationFiles(["1_init.sql"])).toThrow(/invalide/);
    expect(() => parseMigrationFiles(["001-init.sql"])).toThrow(/invalide/);
  });

  it("rejette une version en double", () => {
    expect(() => parseMigrationFiles(["001_a.sql", "001_b.sql"])).toThrow(/double/);
  });
});

describe("checksum", () => {
  it("ignore la différence CRLF / LF", () => {
    expect(checksum("a;\r\nb;\r\n")).toBe(checksum("a;\nb;\n"));
  });
});

describe("pendingMigrations", () => {
  const files = parseMigrationFiles(["001_init.sql", "002_add_x.sql"]).map((f) => ({
    ...f,
    checksum: checksum(f.filename),
  }));

  it("renvoie les migrations non appliquées", () => {
    const pending = pendingMigrations(files, [
      { version: "001", checksum: checksum("001_init.sql") },
    ]);
    expect(pending.map((f) => f.version)).toEqual(["002"]);
  });

  it("refuse une migration modifiée après application", () => {
    expect(() => pendingMigrations(files, [{ version: "001", checksum: "autre" }])).toThrow(
      /modifiée/,
    );
  });

  it("refuse une migration appliquée mais absente du dossier", () => {
    expect(() =>
      pendingMigrations(files, [{ version: "003", checksum: "x" }]),
    ).toThrow(/absente/);
  });
});
