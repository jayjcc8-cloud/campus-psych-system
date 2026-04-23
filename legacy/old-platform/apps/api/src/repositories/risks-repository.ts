import type { RiskFlag, RiskProcessStatus } from "@campus-psych/domain";
import { getDatabase } from "../db/client";

interface RiskRow {
  id: string;
  student_id: string;
  appointment_id: string | null;
  trigger_reason: string;
  level: RiskFlag["level"];
  status: RiskProcessStatus;
  assigned_to: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRisk(row: RiskRow): RiskFlag {
  return {
    id: row.id,
    studentId: row.student_id,
    appointmentId: row.appointment_id ?? undefined,
    triggerReason: row.trigger_reason,
    level: row.level,
    status: row.status,
    assignedTo: row.assigned_to ?? undefined,
    nextFollowUpAt: row.next_follow_up_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listRiskFlagsRaw() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, student_id, appointment_id, trigger_reason, level, status, assigned_to, next_follow_up_at, created_at, updated_at
       FROM risk_flags
       ORDER BY created_at DESC`
    )
    .all() as RiskRow[];

  return rows.map(mapRisk);
}

export function countActiveRiskFlags() {
  const db = getDatabase();
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM risk_flags WHERE status <> 'closed'`)
    .get() as { count: number };

  return row.count;
}

export function insertRiskFlag(risk: RiskFlag) {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO risk_flags (
      id, student_id, appointment_id, trigger_reason, level, status, assigned_to, next_follow_up_at, created_at, updated_at
    ) VALUES (
      @id, @studentId, @appointmentId, @triggerReason, @level, @status, @assignedTo, @nextFollowUpAt, @createdAt, @updatedAt
    )`
  ).run({
    ...risk,
    appointmentId: risk.appointmentId ?? null,
    assignedTo: risk.assignedTo ?? null,
    nextFollowUpAt: risk.nextFollowUpAt ?? null
  });

  return risk;
}

export function updateRiskFlagById(
  id: string,
  payload: {
    status?: RiskProcessStatus;
    assignedTo?: string;
    nextFollowUpAt?: string;
    updatedAt: string;
  }
) {
  const db = getDatabase();
  const current = db
    .prepare(
      `SELECT id, student_id, appointment_id, trigger_reason, level, status, assigned_to, next_follow_up_at, created_at, updated_at
       FROM risk_flags
       WHERE id = ?`
    )
    .get(id) as RiskRow | undefined;

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    status: payload.status ?? current.status,
    assigned_to: payload.assignedTo ?? current.assigned_to,
    next_follow_up_at: payload.nextFollowUpAt ?? current.next_follow_up_at,
    updated_at: payload.updatedAt
  };

  db.prepare(
    `UPDATE risk_flags
     SET status = @status,
         assigned_to = @assigned_to,
         next_follow_up_at = @next_follow_up_at,
         updated_at = @updated_at
     WHERE id = @id`
  ).run(next);

  return mapRisk(next);
}

