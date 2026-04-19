import type { AuditLog } from "@campus-psych/domain";
import { getDatabase } from "../db/client";

interface AuditLogRow {
  id: string;
  operator_id: string;
  operator_role: AuditLog["operatorRole"];
  action_type: string;
  target_type: string;
  target_id: string;
  detail: string | null;
  created_at: string;
}

function mapAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    operatorId: row.operator_id,
    operatorRole: row.operator_role,
    actionType: row.action_type,
    targetType: row.target_type,
    targetId: row.target_id,
    detail: row.detail ?? undefined,
    createdAt: row.created_at
  };
}

export function listAuditLogs() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, operator_id, operator_role, action_type, target_type, target_id, detail, created_at
       FROM audit_logs
       ORDER BY created_at DESC`
    )
    .all() as AuditLogRow[];

  return rows.map(mapAuditLog);
}

export function insertAuditLog(log: AuditLog) {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO audit_logs (
      id, operator_id, operator_role, action_type, target_type, target_id, detail, created_at
    ) VALUES (
      @id, @operatorId, @operatorRole, @actionType, @targetType, @targetId, @detail, @createdAt
    )`
  ).run({
    ...log,
    detail: log.detail ?? null
  });
}
