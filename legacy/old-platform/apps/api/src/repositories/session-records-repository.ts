import type { SessionRecord } from "@campus-psych/domain";
import { getDatabase } from "../db/client";

interface SessionRecordRow {
  id: string;
  appointment_id: string;
  issue_type: SessionRecord["issueType"];
  emotion_level: SessionRecord["emotionLevel"];
  risk_level: SessionRecord["riskLevel"];
  need_follow_up: number;
  summary_note: string;
  private_note: string | null;
  created_at: string;
  updated_at: string;
}

function mapSessionRecord(row: SessionRecordRow): SessionRecord {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    issueType: row.issue_type,
    emotionLevel: row.emotion_level,
    riskLevel: row.risk_level,
    needFollowUp: row.need_follow_up === 1,
    summaryNote: row.summary_note,
    privateNote: row.private_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listSessionRecords() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, appointment_id, issue_type, emotion_level, risk_level, need_follow_up, summary_note, private_note, created_at, updated_at
       FROM session_records
       ORDER BY created_at DESC`
    )
    .all() as SessionRecordRow[];

  return rows.map(mapSessionRecord);
}

export function insertSessionRecord(record: SessionRecord) {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO session_records (
      id, appointment_id, issue_type, emotion_level, risk_level, need_follow_up, summary_note, private_note, created_at, updated_at
    ) VALUES (
      @id, @appointmentId, @issueType, @emotionLevel, @riskLevel, @needFollowUp, @summaryNote, @privateNote, @createdAt, @updatedAt
    )`
  ).run({
    ...record,
    needFollowUp: record.needFollowUp ? 1 : 0,
    privateNote: record.privateNote ?? null
  });

  return record;
}

