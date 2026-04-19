import type { Counselor, CounselorScheduleSlot, UserProfile } from "@campus-psych/domain";
import { getDatabase } from "../db/client";

interface UserRow {
  id: string;
  role: UserProfile["role"];
  display_name: string;
  masked_display_name: string;
  school_id: string | null;
  visibility_level: UserProfile["visibilityLevel"];
}

interface CounselorRow {
  id: string;
  display_name: string;
  specialty_json: string;
  intro: string;
  gender: Counselor["gender"] | null;
  next_available_slot: string | null;
}

interface ScheduleRow {
  id: string;
  counselor_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  available: number;
}

function mapUser(row: UserRow): UserProfile {
  return {
    id: row.id,
    role: row.role,
    displayName: row.display_name,
    maskedDisplayName: row.masked_display_name,
    schoolId: row.school_id ?? undefined,
    visibilityLevel: row.visibility_level
  };
}

function mapCounselor(row: CounselorRow): Counselor {
  return {
    id: row.id,
    displayName: row.display_name,
    specialty: JSON.parse(row.specialty_json) as string[],
    intro: row.intro,
    gender: row.gender ?? undefined,
    nextAvailableSlot: row.next_available_slot
  };
}

function mapSchedule(row: ScheduleRow): CounselorScheduleSlot {
  return {
    id: row.id,
    counselorId: row.counselor_id,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    available: row.available === 1
  };
}

export function getCurrentStudentProfile(studentId = "student-001") {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT id, role, display_name, masked_display_name, school_id, visibility_level
       FROM users
       WHERE id = ? AND role = 'student'`
    )
    .get(studentId) as UserRow | undefined;

  if (!row) {
    throw new Error("Seeded student profile not found.");
  }

  return mapUser(row);
}

export function listCounselors() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, display_name, specialty_json, intro, gender, next_available_slot
       FROM counselors
       ORDER BY display_name ASC`
    )
    .all() as CounselorRow[];

  return rows.map(mapCounselor);
}

export function getCounselorDetail(id: string) {
  const db = getDatabase();
  const counselor = db
    .prepare(
      `SELECT id, display_name, specialty_json, intro, gender, next_available_slot
       FROM counselors
       WHERE id = ?`
    )
    .get(id) as CounselorRow | undefined;

  const schedules = db
    .prepare(
      `SELECT id, counselor_id, start_time, end_time, capacity, available
       FROM counselor_schedules
       WHERE counselor_id = ?
       ORDER BY start_time ASC`
    )
    .all(id) as ScheduleRow[];

  return {
    counselor: counselor ? mapCounselor(counselor) : null,
    schedules: schedules.map(mapSchedule)
  };
}

export function findScheduleSlotById(id: string) {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT id, counselor_id, start_time, end_time, capacity, available
       FROM counselor_schedules
       WHERE id = ?`
    )
    .get(id) as ScheduleRow | undefined;

  return row ? mapSchedule(row) : null;
}

export function getScheduleSlotStartTime(id: string) {
  const db = getDatabase();
  const row = db
    .prepare(`SELECT start_time FROM counselor_schedules WHERE id = ?`)
    .get(id) as { start_time: string } | undefined;

  return row?.start_time ?? null;
}

