import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { after, beforeEach, test } from "node:test";
import { existsSync, mkdtempSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const testDirectory = mkdtempSync(join(tmpdir(), "pulsecity-saved-runs-"));
const databasePath = join(testDirectory, "runs.sqlite");
process.env.PULSECITY_DB_PATH = databasePath;

const { isSavedRunInput, listSavedRuns, saveRun } = await import("../lib/saved-runs.ts");

function closeTestDatabase() {
  const database = globalThis.pulseCityDatabase;
  if (database) {
    database.close();
    delete globalThis.pulseCityDatabase;
  }
}

function resetTestDatabase() {
  closeTestDatabase();
  for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    if (existsSync(path)) unlinkSync(path);
  }
}

function makeRun(overrides = {}) {
  return {
    clientKey: "run-key",
    crisisName: "Flood",
    completedAt: "2026-10-15T10:00:00.000Z",
    score: 76,
    requestsResolved: 3,
    requestTotal: 4,
    actionsTaken: 5,
    responseUnitsUsed: 2,
    supplyUnitsUsed: 1,
    sheltersOpened: 1,
    outcomes: 3,
    ...overrides,
  };
}

beforeEach(resetTestDatabase);
after(() => {
  resetTestDatabase();
  rmSync(testDirectory, { recursive: true, force: true });
});

test("validates run records and rejects inconsistent or out-of-range values", () => {
  assert.equal(isSavedRunInput(makeRun()), true);
  assert.equal(isSavedRunInput(makeRun({ score: 0 })), true);
  assert.equal(isSavedRunInput(makeRun({ score: 101 })), false);
  assert.equal(isSavedRunInput(makeRun({ requestsResolved: 5 })), false);
  assert.equal(isSavedRunInput(makeRun({ completedAt: "not-a-date" })), false);
  assert.equal(isSavedRunInput(makeRun({ clientKey: "" })), false);
  assert.equal(isSavedRunInput(null), false);
});

test("persists completed runs across process restarts and deduplicates submissions", () => {
  const saved = saveRun(makeRun());
  const duplicate = saveRun(makeRun({ score: 5, crisisName: "Different" }));

  assert.equal(duplicate.id, saved.id);
  assert.equal(duplicate.score, 76);
  assert.equal(duplicate.crisisName, "Flood");
  assert.equal("clientKey" in saved, false);

  closeTestDatabase();
  const moduleUrl = new URL("../lib/saved-runs.ts", import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      "const { listSavedRuns } = await import(process.env.PULSECITY_TEST_MODULE); console.log(JSON.stringify(listSavedRuns()));",
    ],
    {
      env: {
        ...process.env,
        PULSECITY_DB_PATH: databasePath,
        PULSECITY_TEST_MODULE: moduleUrl,
      },
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [saved]);
});

test("keeps only the ten newest completed runs", () => {
  for (let index = 0; index < 11; index += 1) {
    saveRun(makeRun({
      clientKey: `run-${index}`,
      completedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      score: index,
    }));
  }

  const runs = listSavedRuns();
  assert.equal(runs.length, 10);
  assert.equal(runs[0].score, 10);
  assert.equal(runs.at(-1).score, 1);
});
