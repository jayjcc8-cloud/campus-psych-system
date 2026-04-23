import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { hashPassword } from "../common/security.js";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgresql://teacher_support:teacher_support@127.0.0.1:5432/teacher_support"
  });

  query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
    return this.pool.query<T>(text, params);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async initialize() {
    await this.pool.query(schemaSql);
    await this.seed();
  }

  private async seed() {
    const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123456";
    const passwordHash = hashPassword(adminPassword);

    await this.pool.query(
      `INSERT INTO admin_users (id, username, display_name, password_hash, role, status, created_at, updated_at)
       VALUES (gen_random_uuid(), 'center-admin', '心理服务中心管理员', $1, 'center_admin', 'active', now(), now())
       ON CONFLICT (username) DO NOTHING`,
      [passwordHash]
    );

    const count = await this.pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM support_slots");
    if (Number(count.rows[0]?.count ?? 0) > 0) {
      return;
    }

    await this.pool.query(
      `INSERT INTO support_slots (id, start_time, end_time, capacity, available, created_at, updated_at)
       VALUES
       (gen_random_uuid(), now() + interval '1 day', now() + interval '1 day 1 hour', 4, true, now(), now()),
       (gen_random_uuid(), now() + interval '2 days', now() + interval '2 days 1 hour', 4, true, now(), now()),
       (gen_random_uuid(), now() + interval '3 days', now() + interval '3 days 1 hour', 4, true, now(), now())`
    );
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

const schemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS support_slots (
  id UUID PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY,
  receipt_code_hash TEXT NOT NULL UNIQUE,
  anonymous_session_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  slot_id UUID NOT NULL REFERENCES support_slots(id),
  issue_type TEXT NOT NULL,
  contact_email TEXT,
  contact_note TEXT,
  remark TEXT,
  status TEXT NOT NULL CHECK (status IN ('new', 'viewed', 'noted', 'closed', 'withdrawn', 'spam')),
  abuse_status TEXT NOT NULL CHECK (abuse_status IN ('clean', 'limited', 'spam')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  withdrawn_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_requests_slot_status ON support_requests(slot_id, status);
CREATE INDEX IF NOT EXISTS idx_support_requests_session_created ON support_requests(anonymous_session_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_ip_created ON support_requests(ip_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS support_request_events (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('anonymous_user', 'center_staff', 'system')),
  actor_id TEXT,
  event_type TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  mfa_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL
);
`;
