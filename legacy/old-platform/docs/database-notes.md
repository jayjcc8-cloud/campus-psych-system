# Database Notes

## Local persistence

- Engine: SQLite
- Driver: `better-sqlite3`
- File path: `apps/api/data/campus-psych.sqlite`

## Schema coverage

The current schema supports these persisted chains:

- appointment
- session-record
- risk
- config
- audit-log

Supporting reference tables are also included:

- users
- counselors
- counselor-schedules

## Bootstrap commands

- `pnpm --filter @campus-psych/api db:migrate`
- `pnpm --filter @campus-psych/api db:seed`
- `pnpm --filter @campus-psych/api db:init`

## Current behavior

- App startup initializes and seeds the local database automatically.
- Seed data is idempotent through `INSERT OR IGNORE`.
- Services now read and write through repository modules instead of the removed in-memory store.

## Follow-up

- Add repository tests for write paths and transaction integrity.
- Add schema migration versioning before multi-environment rollout.
- Decide when to replace SQLite with Postgres or a managed school-approved database.
