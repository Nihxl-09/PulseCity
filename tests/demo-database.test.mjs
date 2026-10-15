import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { after, beforeEach, test } from "node:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import {
  backupDatabase,
  getSavedRunCount,
  resetSavedRuns,
} from "../lib/demo-database.mjs";

const testDirectory = mkdtempSync(join(tmpdir(), "pulsecity-demo-db-"));
const databasePath = join(testDirectory, "runs.sqlite");
const scriptPath = fileURLToPath(new URL("../scripts/demo-data.mjs", import.meta.url));

function populateTestDatabase() {
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS completed_runs (
      id INTEGER PRIMARY KEY,
      crisis_name TEXT NOT NULL
    );
    DELETE FROM completed_runs;
    INSERT INTO completed_runs (crisis_name) VALUES ('Flood'), ('Fire');
  `);
  database.close();
}

beforeEach(populateTestDatabase);
after(() => rmSync(testDirectory, { recursive: true, force: true }));

test("creates a consistent SQLite backup without changing saved runs", () => {
  const { backupPath, count } = backupDatabase(databasePath);
  assert.equal(count, 2);
  assert.equal(existsSync(backupPath), true);
  assert.equal(getSavedRunCount(databasePath), 2);

  const backup = new DatabaseSync(backupPath);
  try {
    assert.equal(
      Number(backup.prepare("SELECT COUNT(*) AS count FROM completed_runs").get().count),
      2
    );
  } finally {
    backup.close();
  }
});

test("backs up run history before reset and empties the active database", () => {
  const { backupPath, deletedCount } = resetSavedRuns(databasePath);
  assert.equal(deletedCount, 2);
  assert.equal(getSavedRunCount(databasePath), 0);
  assert.equal(existsSync(backupPath), true);

  const backup = new DatabaseSync(backupPath);
  try {
    assert.equal(
      Number(backup.prepare("SELECT COUNT(*) AS count FROM completed_runs").get().count),
      2
    );
  } finally {
    backup.close();
  }
});

test("requires exact reset confirmation and leaves history untouched on cancellation", () => {
  const result = spawnSync(process.execPath, [scriptPath, "reset"], {
    cwd: testDirectory,
    env: { ...process.env, PULSECITY_DB_PATH: databasePath },
    input: "not reset\n",
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Reset cancelled; no data was changed\./);
  assert.equal(getSavedRunCount(databasePath), 2);
});

test("reset command backs up history before clearing it after confirmation", () => {
  const result = spawnSync(process.execPath, [scriptPath, "reset"], {
    cwd: testDirectory,
    env: { ...process.env, PULSECITY_DB_PATH: databasePath },
    input: "RESET\n",
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(getSavedRunCount(databasePath), 0);
  const backupPath = result.stdout.match(/Backup saved to: (.+)/)?.[1];
  assert.ok(backupPath);
  const backup = new DatabaseSync(backupPath);
  try {
    assert.equal(
      Number(backup.prepare("SELECT COUNT(*) AS count FROM completed_runs").get().count),
      2
    );
  } finally {
    backup.close();
  }
});
