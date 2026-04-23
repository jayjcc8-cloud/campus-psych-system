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

interface AppointmentWithDetailRow extends AppointmentRow {
  student_display_name: string | null;
  student_masked_display_name: string | null;
  student_school_id: string | null;
  student_college: string | null;
  schedule_start_time: string | null;
  schedule_end_time: string | null;
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

function mapAppointmentWithDetail(row: AppointmentWithDetailRow) {
  return {
    ...mapAppointment(row),
    studentDisplayName: row.student_display_name ?? undefined,
    studentMaskedDisplayName: row.student_masked_display_name ?? undefined,
    studentSchoolId: row.student_school_id ?? undefined,
    studentCollege: row.student_college ?? undefined,
    scheduleStartTime: row.schedule_start_time ?? undefined,
    scheduleEndTime: row.schedule_end_time ?? undefined
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
      `SELECT appointments.id,
              appointments.student_id,
              appointments.counselor_id,
              appointments.schedule_slot_id,
              appointments.issue_entry_type,
              appointments.consult_mode,
              appointments.status,
              appointments.remark,
              appointments.cancel_reason,
              appointments.created_at,
              appointments.updated_at,
              users.display_name AS student_display_name,
              users.masked_display_name AS student_masked_display_name,
              users.school_id AS student_school_id,
              users.college AS student_college,
              counselor_schedules.start_time AS schedule_start_time,
              counselor_schedules.end_time AS schedule_end_time
       FROM appointments
       LEFT JOIN users ON users.id = appointments.student_id
       LEFT JOIN counselor_schedules ON counselor_schedules.id = appointments.schedule_slot_id
       WHERE appointments.student_id = ?
       ORDER BY
         CASE appointments.status
           WHEN 'pending' THEN 0
           WHEN 'confirmed' THEN 1
           ELSE 2
         END,
         counselor_schedules.start_time ASC,
         appointments.created_at DESC`
    )
    .all(studentId) as AppointmentWithDetailRow[];

  return rows.map(mapAppointmentWithDetail);
}

export function listAppointmentsByCounselor(counselorId: string) {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT appointments.id,
              appointments.student_id,
              appointments.counselor_id,
              appointments.schedule_slot_id,
              appointments.issue_entry_type,
              appointments.consult_mode,
              appointments.status,
              appointments.remark,
              appointments.cancel_reason,
              appointments.created_at,
              appointments.updated_at,
              users.display_name AS student_display_name,
              users.masked_display_name AS student_masked_display_name,
              users.school_id AS student_school_id,
              users.college AS student_college,
              counselor_schedules.start_time AS schedule_start_time,
              counselor_schedules.end_time AS schedule_end_time
       FROM appointments
       LEFT JOIN users ON users.id = appointments.student_id
       LEFT JOIN counselor_schedules ON counselor_schedules.id = appointments.schedule_slot_id
       WHERE appointments.counselor_id = ?
       ORDER BY
         CASE appointments.status
           WHEN 'pending' THEN 0
           WHEN 'confirmed' THEN 1
           ELSE 2
         END,
         counselor_schedules.start_time ASC,
         appointments.created_at DESC`
    )
    .all(counselorId) as AppointmentWithDetailRow[];

  return rows.map(mapAppointmentWithDetail);
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

export function hasActiveAppointmentForSchedule(scheduleSlotId: string) {
  return hasActiveAppointmentInSlot(scheduleSlotId);
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

export function cancelAppointmentById(id: string, updatedAt: string, cancelReason: string | null) {
  const db = getDatabase();
  db.prepare(
    `UPDATE appointments
     SET status = 'cancelled',
         cancel_reason = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(cancelReason, updatedAt, id);
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
