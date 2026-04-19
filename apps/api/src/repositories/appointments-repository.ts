import type { Appointment, AppointmentStatus } from "@campus-psych/domain";
import { getDatabase } from "../db/client";

interface AppointmentRow {
  id: string;
  student_id: string;
  counselor_id: string;
  schedule_slot_id: string;
  issue_entry_type: Appointment["issueEntryType"];
  consult_mode: Appointment["consultMode"];
  status: AppointmentStatus;
  remark: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    studentId: row.student_id,
    counselorId: row.counselor_id,
    scheduleSlotId: row.schedule_slot_id,
    issueEntryType: row.issue_entry_type,
    consultMode: row.consult_mode,
    status: row.status,
    remark: row.remark ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listAppointments() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, student_id, counselor_id, schedule_slot_id, issue_entry_type, consult_mode, status, remark, cancel_reason, created_at, updated_at
       FROM appointments
       ORDER BY created_at DESC`
    )
    .all() as AppointmentRow[];

  return rows.map(mapAppointment);
}

export function listAppointmentsByStudent(studentId: string) {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, student_id, counselor_id, schedule_slot_id, issue_entry_type, consult_mode, status, remark, cancel_reason, created_at, updated_at
       FROM appointments
       WHERE student_id = ?
       ORDER BY created_at DESC`
    )
    .all(studentId) as AppointmentRow[];

  return rows.map(mapAppointment);
}

export function findAppointmentById(id: string) {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT id, student_id, counselor_id, schedule_slot_id, issue_entry_type, consult_mode, status, remark, cancel_reason, created_at, updated_at
       FROM appointments
       WHERE id = ?`
    )
    .get(id) as AppointmentRow | undefined;

  return row ? mapAppointment(row) : null;
}

export function countActiveAppointmentsForStudent(studentId: string) {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE student_id = ?
         AND status IN ('pending', 'confirmed')`
    )
    .get(studentId) as { count: number };

  return row.count;
}

export function hasActiveAppointmentInSlot(scheduleSlotId: string) {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM appointments
       WHERE schedule_slot_id = ?
         AND status IN ('pending', 'confirmed')`
    )
    .get(scheduleSlotId) as { count: number };

  return row.count > 0;
}

export function insertAppointment(appointment: Appointment) {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO appointments (
      id, student_id, counselor_id, schedule_slot_id, issue_entry_type, consult_mode, status, remark, cancel_reason, created_at, updated_at
    ) VALUES (
      @id, @studentId, @counselorId, @scheduleSlotId, @issueEntryType, @consultMode, @status, @remark, @cancelReason, @createdAt, @updatedAt
    )`
  ).run({
    ...appointment,
    cancelReason: appointment.cancelReason ?? null,
    remark: appointment.remark ?? null
  });

  return appointment;
}

export function updateAppointmentStatusById(id: string, status: AppointmentStatus, updatedAt: string) {
  const db = getDatabase();
  db.prepare(
    `UPDATE appointments
     SET status = ?, updated_at = ?
     WHERE id = ?`
  ).run(status, updatedAt, id);
}

export function getAppointmentSummary() {
  const db = getDatabase();
  const total = (db.prepare(`SELECT COUNT(*) AS count FROM appointments`).get() as { count: number }).count;
  const pending = (
    db.prepare(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'pending'`).get() as {
      count: number;
    }
  ).count;
  const confirmed = (
    db.prepare(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'confirmed'`).get() as {
      count: number;
    }
  ).count;
  const completed = (
    db.prepare(`SELECT COUNT(*) AS count FROM appointments WHERE status = 'completed'`).get() as {
      count: number;
    }
  ).count;

  return {
    total,
    pending,
    confirmed,
    completed
  };
}

