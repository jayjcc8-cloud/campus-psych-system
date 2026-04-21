import type { Counselor, CounselorScheduleSlot, UserProfile } from "@campus-psych/domain";
import { getDatabase } from "../db/client";

interface UserRow {
  id: string;
  role: UserProfile["role"];
  display_name: string;
  masked_display_name: string;
  school_id: string | null;
  college: string | null;
  visibility_level: UserProfile["visibilityLevel"];
  created_at?: string;
  updated_at?: string;
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
    college: row.college ?? undefined,
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
    nextAvailableSlot: getNextAvailableSlot(row.id)
  };
}

function mapSchedule(row: ScheduleRow): CounselorScheduleSlot {
  const bookable = row.available === 1 && !hasActiveAppointmentForScheduleId(row.id);

  return {
    id: row.id,
    counselorId: row.counselor_id,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    available: bookable
  };
}

function mapScheduleForCounselorWorkspace(row: ScheduleRow): CounselorScheduleSlot {
  return {
    id: row.id,
    counselorId: row.counselor_id,
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    available: row.available === 1
  };
}

function hasActiveAppointmentForScheduleId(scheduleSlotId: string) {
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

function getNextAvailableSlot(counselorId: string) {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT schedules.start_time
       FROM counselor_schedules schedules
       WHERE schedules.counselor_id = ?
         AND schedules.available = 1
         AND schedules.start_time >= ?
         AND NOT EXISTS (
           SELECT 1
           FROM appointments appointments
           WHERE appointments.schedule_slot_id = schedules.id
             AND appointments.status IN ('pending', 'confirmed')
         )
       ORDER BY schedules.start_time ASC
       LIMIT 1`
    )
    .get(counselorId, new Date().toISOString()) as { start_time: string } | undefined;

  return row?.start_time ?? null;
}

function findStudentRow(studentId: string) {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT id, role, display_name, masked_display_name, school_id, college, visibility_level, created_at, updated_at
       FROM users
       WHERE id = ? AND role = 'student'`
    )
    .get(studentId) as UserRow | undefined;
}

function findDefaultStudentRow() {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT id, role, display_name, masked_display_name, school_id, college, visibility_level, created_at, updated_at
       FROM users
       WHERE role = 'student'
       ORDER BY created_at ASC
       LIMIT 1`
    )
    .get() as UserRow | undefined;
}

function resolveStudentRow(studentId = "student-001") {
  const directMatch = findStudentRow(studentId);

  if (directMatch) {
    return directMatch;
  }

  if (studentId === "student-bootstrap") {
    return findStudentRow("student-001") ?? findDefaultStudentRow();
  }

  return null;
}

export function getCurrentStudentProfile(studentId = "student-001") {
  const row = resolveStudentRow(studentId);

  if (!row) {
    throw new Error("Seeded student profile not found.");
  }

  return mapUser(row);
}

function toMaskedStudentName(displayName: string, schoolId?: string) {
  const trimmedName = displayName.trim();

  if (!trimmedName) {
    return schoolId ? `同学 ${schoolId.slice(-4)}` : "已绑定同学";
  }

  return `${trimmedName.slice(-2)}同学`;
}

export function updateCurrentStudentProfile(
  studentId: string,
  payload: { schoolId: string; displayName: string; college: string }
) {
  const currentStudent = getCurrentStudentProfile(studentId);
  const db = getDatabase();

  db.prepare(
    `UPDATE users
     SET display_name = ?,
         masked_display_name = ?,
         school_id = ?,
         college = ?,
         visibility_level = 'authorized',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND role = 'student'`
  ).run(
    payload.displayName.trim(),
    toMaskedStudentName(payload.displayName, payload.schoolId),
    payload.schoolId.trim(),
    payload.college.trim(),
    currentStudent.id
  );

  return getCurrentStudentProfile(currentStudent.id);
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

export function getCounselorDetailByUserId(userId: string) {
  const counselorId = getCounselorIdByUserId(userId);

  if (!counselorId) {
    return { counselor: null, schedules: [] };
  }

  const detail = getCounselorDetail(counselorId);
  const db = getDatabase();
  const schedules = db
    .prepare(
      `SELECT id, counselor_id, start_time, end_time, capacity, available
       FROM counselor_schedules
       WHERE counselor_id = ?
       ORDER BY start_time ASC`
    )
    .all(counselorId) as ScheduleRow[];

  return {
    ...detail,
    schedules: schedules.map(mapScheduleForCounselorWorkspace)
  };
}

export function getCounselorIdByUserId(userId: string) {
  const db = getDatabase();
  const row = db
    .prepare(`SELECT id FROM counselors WHERE user_id = ?`)
    .get(userId) as { id: string } | undefined;

  return row?.id ?? null;
}

export function updateCounselorProfile(
  counselorId: string,
  payload: { intro: string; specialty: string[] }
) {
  const db = getDatabase();

  db.prepare(
    `UPDATE counselors
     SET intro = ?,
         specialty_json = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(payload.intro.trim(), JSON.stringify(payload.specialty), counselorId);

  return getCounselorDetail(counselorId).counselor;
}

export function insertCounselorSchedule(
  slot: CounselorScheduleSlot
) {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  db.prepare(
    `INSERT INTO counselor_schedules (
      id, counselor_id, start_time, end_time, capacity, available, created_at, updated_at
    ) VALUES (
      @id, @counselorId, @startTime, @endTime, @capacity, @available, @createdAt, @updatedAt
    )`
  ).run({
    id: slot.id,
    counselorId: slot.counselorId,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: slot.capacity,
    available: slot.available ? 1 : 0,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return findScheduleSlotById(slot.id);
}

export function updateCounselorSchedule(
  slotId: string,
  counselorId: string,
  payload: Partial<Pick<CounselorScheduleSlot, "startTime" | "endTime" | "capacity" | "available">>
) {
  const current = findScheduleSlotById(slotId);

  if (!current || current.counselorId !== counselorId) {
    return null;
  }

  const nextSlot = {
    startTime: payload.startTime ?? current.startTime,
    endTime: payload.endTime ?? current.endTime,
    capacity: payload.capacity ?? current.capacity,
    available: payload.available ?? current.available
  };
  const db = getDatabase();

  db.prepare(
    `UPDATE counselor_schedules
     SET start_time = ?,
         end_time = ?,
         capacity = ?,
         available = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND counselor_id = ?`
  ).run(
    nextSlot.startTime,
    nextSlot.endTime,
    nextSlot.capacity,
    nextSlot.available ? 1 : 0,
    slotId,
    counselorId
  );

  return findScheduleSlotById(slotId);
}

export function refreshCounselorNextAvailableSlot(counselorId: string) {
  const nextAvailableSlot = getNextAvailableSlot(counselorId);
  const db = getDatabase();

  db.prepare(
    `UPDATE counselors
     SET next_available_slot = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(nextAvailableSlot, counselorId);

  return nextAvailableSlot;
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
