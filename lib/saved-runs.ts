import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type SavedRunInput = {
  clientKey: string;
  crisisName: string;
  completedAt: string;
  score: number;
  requestsResolved: number;
  requestTotal: number;
  actionsTaken: number;
  responseUnitsUsed: number;
  supplyUnitsUsed: number;
  sheltersOpened: number;
  outcomes: number;
};

export type SavedRunRecord = Omit<SavedRunInput, "clientKey"> & {
  id: number;
};

type RunRow = {
  id: number;
  crisis_name: string;
  completed_at: string;
  score: number;
  requests_resolved: number;
  request_total: number;
  actions_taken: number;
  response_units_used: number;
  supply_units_used: number;
  shelters_opened: number;
  outcomes: number;
};

const globalForDatabase = globalThis as typeof globalThis & {
  pulseCityDatabase?: DatabaseSync;
};

function getDatabase() {
  if (globalForDatabase.pulseCityDatabase) {
    return globalForDatabase.pulseCityDatabase;
  }

  const configuredPath = process.env.PULSECITY_DB_PATH;
  const databasePath = configuredPath
    ? resolve(/* turbopackIgnore: true */ configuredPath)
    : join(process.cwd(), "data", "pulsecity.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS completed_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_key TEXT NOT NULL UNIQUE,
      crisis_name TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
      requests_resolved INTEGER NOT NULL CHECK (requests_resolved >= 0),
      request_total INTEGER NOT NULL CHECK (request_total >= 0),
      actions_taken INTEGER NOT NULL CHECK (actions_taken >= 0),
      response_units_used INTEGER NOT NULL CHECK (response_units_used >= 0),
      supply_units_used INTEGER NOT NULL CHECK (supply_units_used >= 0),
      shelters_opened INTEGER NOT NULL CHECK (shelters_opened >= 0),
      outcomes INTEGER NOT NULL CHECK (outcomes >= 0)
    );
    CREATE INDEX IF NOT EXISTS completed_runs_by_date
      ON completed_runs (completed_at DESC, id DESC);
  `);

  globalForDatabase.pulseCityDatabase = database;
  return database;
}

function toSavedRun(row: RunRow): SavedRunRecord {
  return {
    id: row.id,
    crisisName: row.crisis_name,
    completedAt: row.completed_at,
    score: row.score,
    requestsResolved: row.requests_resolved,
    requestTotal: row.request_total,
    actionsTaken: row.actions_taken,
    responseUnitsUsed: row.response_units_used,
    supplyUnitsUsed: row.supply_units_used,
    sheltersOpened: row.shelters_opened,
    outcomes: row.outcomes,
  };
}

export function listSavedRuns() {
  const rows = getDatabase()
    .prepare(`
      SELECT id, crisis_name, completed_at, score, requests_resolved,
             request_total, actions_taken, response_units_used,
             supply_units_used, shelters_opened, outcomes
      FROM completed_runs
      ORDER BY completed_at DESC, id DESC
      LIMIT 10
    `)
    .all() as RunRow[];

  return rows.map(toSavedRun);
}

export function saveRun(run: SavedRunInput) {
  const database = getDatabase();
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare(`
      INSERT INTO completed_runs (
        client_key, crisis_name, completed_at, score, requests_resolved,
        request_total, actions_taken, response_units_used,
        supply_units_used, shelters_opened, outcomes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(client_key) DO NOTHING
    `).run(
      run.clientKey,
      run.crisisName,
      run.completedAt,
      run.score,
      run.requestsResolved,
      run.requestTotal,
      run.actionsTaken,
      run.responseUnitsUsed,
      run.supplyUnitsUsed,
      run.sheltersOpened,
      run.outcomes
    );

    const row = database.prepare(`
      SELECT id, crisis_name, completed_at, score, requests_resolved,
             request_total, actions_taken, response_units_used,
             supply_units_used, shelters_opened, outcomes
      FROM completed_runs
      WHERE client_key = ?
    `).get(run.clientKey) as RunRow | undefined;

    if (!row) {
      throw new Error("Saved run was not found after insert.");
    }

    database.exec(`
      DELETE FROM completed_runs
      WHERE id NOT IN (
        SELECT id FROM completed_runs
        ORDER BY completed_at DESC, id DESC
        LIMIT 10
      )
    `);

    database.exec("COMMIT");
    return toSavedRun(row);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function isSavedRunInput(value: unknown): value is SavedRunInput {
  if (typeof value !== "object" || value === null) return false;
  const run = value as Partial<SavedRunInput>;
  const isCount = (entry: unknown): entry is number =>
    typeof entry === "number" && Number.isInteger(entry) && entry >= 0 && entry <= 1_000_000;

  return (
    typeof run.clientKey === "string" &&
    run.clientKey.length > 0 &&
    run.clientKey.length <= 120 &&
    typeof run.crisisName === "string" &&
    run.crisisName.length > 0 &&
    run.crisisName.length <= 80 &&
    typeof run.completedAt === "string" &&
    !Number.isNaN(Date.parse(run.completedAt)) &&
    isCount(run.score) &&
    run.score <= 100 &&
    isCount(run.requestsResolved) &&
    isCount(run.requestTotal) &&
    run.requestsResolved <= run.requestTotal &&
    isCount(run.actionsTaken) &&
    isCount(run.responseUnitsUsed) &&
    isCount(run.supplyUnitsUsed) &&
    isCount(run.sheltersOpened) &&
    isCount(run.outcomes)
  );
}
