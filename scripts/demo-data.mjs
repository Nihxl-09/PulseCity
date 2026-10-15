import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  backupDatabase,
  getSavedRunCount,
  resetSavedRuns,
  resolveDatabasePath,
} from "../lib/demo-database.mjs";

async function run() {
  const operation = process.argv[2];
  const databasePath = resolveDatabasePath();

  if (operation === "backup") {
    const { backupPath, count } = backupDatabase(databasePath);
    console.log(`Backed up ${count} saved run(s) to: ${backupPath}`);
    return;
  }

  if (operation !== "reset") {
    throw new Error("Usage: node scripts/demo-data.mjs <backup|reset>");
  }

  const count = getSavedRunCount(databasePath);
  console.log(`Database: ${databasePath}`);
  console.log(`Saved runs to delete: ${count}`);
  console.log("A SQLite backup will be created before the saved run history is cleared.");

  const prompt = createInterface({ input: stdin, output: stdout });
  let confirmation;
  try {
    confirmation = await prompt.question("Type RESET to continue: ");
  } finally {
    prompt.close();
  }

  if (confirmation !== "RESET") {
    console.log("Reset cancelled; no data was changed.");
    return;
  }

  const { backupPath, deletedCount } = resetSavedRuns(databasePath);
  console.log(`Deleted ${deletedCount} saved run(s).`);
  console.log(`Backup saved to: ${backupPath}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  run().catch((error) => {
    console.error("Demo data operation failed.", error);
    process.exitCode = 1;
  });
}
