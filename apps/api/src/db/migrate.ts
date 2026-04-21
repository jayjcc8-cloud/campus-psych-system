import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getDatabase } from "./client";

function hasColumn(table: string, column: string) {
  const database = getDatabase();
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;

  return rows.some((row) => row.name === column);
}

export function migrateDatabase() {
  const database = getDatabase();
  const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  database.exec(schema);

  if (!hasColumn("users", "college")) {
    database.exec("ALTER TABLE users ADD COLUMN college TEXT");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateDatabase();
  console.log("Database schema is up to date.");
}
