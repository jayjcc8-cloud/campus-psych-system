import { fileURLToPath } from "node:url";
import { migrateDatabase } from "./migrate";
import { seedDatabase } from "./seed";

let initialized = false;

export function initializeDatabase() {
  if (initialized) {
    return;
  }

  migrateDatabase();
  seedDatabase();
  initialized = true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase();
  console.log("Database initialized.");
}

