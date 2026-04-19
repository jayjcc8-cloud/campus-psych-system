import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getDatabase } from "./client";

export function migrateDatabase() {
  const database = getDatabase();
  const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  database.exec(schema);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateDatabase();
  console.log("Database schema is up to date.");
}

