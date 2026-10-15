import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

export function resolveDatabasePath() {
  const configuredPath = process.env.PULSECITY_DB_PATH;
  return configuredPath
    ? resolve(configuredPath)
    : join(process.cwd(), "data", "pulsecity.sqlite");
}

function openRunsDatabase(databasePath) {
  if (!existsSync(databasePath)) {
    throw new Error(`Run-history database does not exist: ${databasePath}`);
  }

  const database = new DatabaseSync(databasePath);
  try {
    const table = database.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'completed_runs'"
    ).get();
    if (!table) {
      throw new Error(`No completed_runs table found in ${databasePath}`);
    }
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

function makeBackupPath(databasePath, date) {
  const timestamp = date.toISOString().replace(/[-:.]/g, "");
  return join(
    dirname(databasePath),
    "backups",
    `pulsecity-${timestamp}-${randomUUID()}.sqlite`
  );
}

export function getSavedRunCount(databasePath = resolveDatabasePath()) {
  const database = openRunsDatabase(databasePath);
  try {
    const result = database.prepare("SELECT COUNT(*) AS count FROM completed_runs").get();
    return Number(result.count);
  } finally {
    database.close();
  }
}

export function backupDatabase(databasePath = resolveDatabasePath(), date = new Date()) {
  const backupPath = makeBackupPath(databasePath, date);
  mkdirSync(dirname(backupPath), { recursive: true });

  const database = openRunsDatabase(databasePath);
  try {
    const count = Number(
      database.prepare("SELECT COUNT(*) AS count FROM completed_runs").get().count
    );
    database.prepare("VACUUM INTO ?").run(backupPath);
    return { backupPath, count };
  } finally {
    database.close();
  }
}

export function resetSavedRuns(databasePath = resolveDatabasePath()) {
  const backup = backupDatabase(databasePath);
  const database = openRunsDatabase(databasePath);
  try {
    database.exec("BEGIN IMMEDIATE");
    try {
      const result = database.prepare("DELETE FROM completed_runs").run();
      database.exec("COMMIT");
      return { backupPath: backup.backupPath, deletedCount: Number(result.changes) };
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  } finally {
    database.close();
  }
}
