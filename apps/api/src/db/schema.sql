PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'counselor', 'admin')),
  display_name TEXT NOT NULL,
  masked_display_name TEXT NOT NULL,
  school_id TEXT,
  visibility_level TEXT NOT NULL CHECK (visibility_level IN ('masked', 'authorized')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS counselors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  specialty_json TEXT NOT NULL,
  intro TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('female', 'male', 'other') OR gender IS NULL),
  next_available_slot TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS counselor_schedules (
  id TEXT PRIMARY KEY,
  counselor_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (counselor_id) REFERENCES counselors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_counselor_schedules_counselor ON counselor_schedules(counselor_id);

CREATE TABLE IF NOT EXISTS public_configs (
  id TEXT PRIMARY KEY,
  announcement TEXT NOT NULL,
  booking_policy TEXT NOT NULL,
  emergency_contacts_json TEXT NOT NULL,
  force_student_id_binding INTEGER NOT NULL DEFAULT 0 CHECK (force_student_id_binding IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  counselor_id TEXT NOT NULL,
  schedule_slot_id TEXT NOT NULL,
  issue_entry_type TEXT NOT NULL,
  consult_mode TEXT NOT NULL CHECK (consult_mode IN ('offline')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'expired')),
  remark TEXT,
  cancel_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (counselor_id) REFERENCES counselors(id),
  FOREIGN KEY (schedule_slot_id) REFERENCES counselor_schedules(id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_student_status ON appointments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_schedule_status ON appointments(schedule_slot_id, status);

CREATE TABLE IF NOT EXISTS session_records (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  emotion_level INTEGER NOT NULL CHECK (emotion_level BETWEEN 1 AND 5),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  need_follow_up INTEGER NOT NULL CHECK (need_follow_up IN (0, 1)),
  summary_note TEXT NOT NULL,
  private_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_records_appointment ON session_records(appointment_id);

CREATE TABLE IF NOT EXISTS risk_flags (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  appointment_id TEXT,
  trigger_reason TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'processed', 'closed')),
  assigned_to TEXT,
  next_follow_up_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_flags_status ON risk_flags(status);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  operator_role TEXT NOT NULL CHECK (operator_role IN ('student', 'counselor', 'admin')),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

