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

    await this.pool.query(
      `INSERT INTO counselors (id, display_name, title, intro, specialties, status, sort_order, created_at, updated_at)
       VALUES
       (gen_random_uuid(), '周老师', '心理咨询师', '专注于以稳定、尊重的方式陪伴教师面对压力、关系和阶段变化。', ARRAY['压力支持', '情绪困扰', '关系议题'], 'approved', 1, now(), now()),
       (gen_random_uuid(), '陈老师', '心理支持顾问', '擅长和来访者一起梳理近期困扰，帮助找到更可承受的节奏。', ARRAY['睡眠状态', '焦虑困扰', '职业阶段'], 'approved', 2, now(), now())
       ON CONFLICT (display_name) DO NOTHING`
    );

    const counselorPasswordHash = hashPassword(process.env.COUNSELOR_PASSWORD ?? "Counselor@123456");
    await this.pool.query(
      `INSERT INTO counselor_accounts (id, counselor_id, username, password_hash, status, created_at, updated_at)
       SELECT gen_random_uuid(), counselors.id, usernames.username, $1, 'active', now(), now()
       FROM counselors
       INNER JOIN (
         VALUES ('周老师', 'zhou-laoshi'),
                ('陈老师', 'chen-laoshi')
       ) AS usernames(display_name, username) ON usernames.display_name = counselors.display_name
       ON CONFLICT (username) DO NOTHING`,
      [counselorPasswordHash]
    );

    const defaultCounselor = await this.pool.query<{ id: string }>(
      "SELECT id FROM counselors WHERE status = 'approved' ORDER BY sort_order ASC, created_at ASC LIMIT 1"
    );
    const defaultCounselorId = defaultCounselor.rows[0]?.id;
    if (defaultCounselorId) {
      await this.pool.query("UPDATE support_slots SET counselor_id = $1 WHERE counselor_id IS NULL", [defaultCounselorId]);
      await this.pool.query("UPDATE support_requests SET counselor_id = $1 WHERE counselor_id IS NULL", [defaultCounselorId]);
    }

    const count = await this.pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM support_slots");
    if (Number(count.rows[0]?.count ?? 0) > 0) {
      return;
    }

    await this.pool.query(
      `INSERT INTO support_slots (id, counselor_id, start_time, end_time, capacity, available, created_at, updated_at)
       VALUES
       (gen_random_uuid(), $1, now() + interval '1 day', now() + interval '1 day 1 hour', 4, true, now(), now()),
       (gen_random_uuid(), $1, now() + interval '2 days', now() + interval '2 days 1 hour', 4, true, now(), now()),
       (gen_random_uuid(), $1, now() + interval '3 days', now() + interval '3 days 1 hour', 4, true, now(), now())`,
      [defaultCounselorId]
    );
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

const schemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS counselors (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  intro TEXT NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'suspended')),
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS support_slots (
  id UUID PRIMARY KEY,
  counselor_id UUID REFERENCES counselors(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS counselor_accounts (
  id UUID PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY,
  receipt_code_hash TEXT NOT NULL UNIQUE,
  anonymous_session_hash TEXT NOT NULL,
  preferred_name TEXT,
  who5_score INTEGER NOT NULL,
  phq9_score INTEGER NOT NULL,
  gad7_score INTEGER NOT NULL,
  wellbeing_level TEXT NOT NULL,
  depression_level TEXT NOT NULL,
  anxiety_level TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  safety_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessments_session_created ON assessments(anonymous_session_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_created ON assessments(risk_level, created_at DESC);

ALTER TABLE support_slots ADD COLUMN IF NOT EXISTS counselor_id UUID REFERENCES counselors(id);
CREATE INDEX IF NOT EXISTS idx_support_slots_counselor_time ON support_slots(counselor_id, start_time);

CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY,
  receipt_code_hash TEXT NOT NULL UNIQUE,
  anonymous_session_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  preferred_name TEXT,
  assessment_id UUID REFERENCES assessments(id),
  counselor_id UUID REFERENCES counselors(id),
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

ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id);
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS counselor_id UUID REFERENCES counselors(id);
CREATE INDEX IF NOT EXISTS idx_support_requests_counselor_status ON support_requests(counselor_id, status);

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
