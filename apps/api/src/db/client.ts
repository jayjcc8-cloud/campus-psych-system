import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let database: Database.Database | null = null;

const dbDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");

export function getDatabaseFilePath() {
  return process.env.DB_FILE ?? path.join(dbDirectory, "campus-psych.sqlite");
}

export function getDatabase() {
  if (database) {
    return database;
  }

  const databaseFile = getDatabaseFilePath();
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

  database = new Database(databaseFile);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  return database;
}

export function runInTransaction<T>(callback: () => T): T {
  const db = getDatabase();
  const transaction = db.transaction(callback);

  return transaction();
}
