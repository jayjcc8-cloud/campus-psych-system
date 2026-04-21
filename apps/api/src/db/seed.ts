import {
  appointmentsFixture,
  auditLogsFixture,
  counselorsFixture,
  currentStudent,
  publicConfigFixture,
  risksFixture,
  scheduleFixture,
  sessionRecordsFixture
} from "@campus-psych/domain";
import { fileURLToPath } from "node:url";
import { getDatabase, runInTransaction } from "./client";
import { migrateDatabase } from "./migrate";

const counselorUsers = [
  {
    id: "counselor-user-001",
    role: "counselor",
    displayName: "Lin",
    maskedDisplayName: "Counselor Lin",
    schoolId: null,
    visibilityLevel: "authorized"
  },
  {
    id: "counselor-user-002",
    role: "counselor",
    displayName: "Chen",
    maskedDisplayName: "Counselor Chen",
    schoolId: null,
    visibilityLevel: "authorized"
  },
  {
    id: "admin-001",
    role: "admin",
    displayName: "Admin",
    maskedDisplayName: "Admin",
    schoolId: null,
    visibilityLevel: "authorized"
  }
] as const;

const counselorUserMap: Record<string, string> = {
  "counselor-001": "counselor-user-001",
  "counselor-002": "counselor-user-002"
};

export function seedDatabase() {
  migrateDatabase();
  const database = getDatabase();
  const timestamp = new Date().toISOString();

  const insertUser = database.prepare(`
    INSERT OR IGNORE INTO users (
      id, role, display_name, masked_display_name, school_id, college, visibility_level, created_at, updated_at
    ) VALUES (
      @id, @role, @displayName, @maskedDisplayName, @schoolId, @college, @visibilityLevel, @createdAt, @updatedAt
    )
  `);

  const insertCounselor = database.prepare(`
    INSERT OR IGNORE INTO counselors (
      id, user_id, display_name, specialty_json, intro, gender, next_available_slot, created_at, updated_at
    ) VALUES (
      @id, @userId, @displayName, @specialtyJson, @intro, @gender, @nextAvailableSlot, @createdAt, @updatedAt
    )
  `);

  const insertSchedule = database.prepare(`
    INSERT OR IGNORE INTO counselor_schedules (
      id, counselor_id, start_time, end_time, capacity, available, created_at, updated_at
    ) VALUES (
      @id, @counselorId, @startTime, @endTime, @capacity, @available, @createdAt, @updatedAt
    )
  `);

  const insertConfig = database.prepare(`
    INSERT OR IGNORE INTO public_configs (
      id, announcement, booking_policy, emergency_contacts_json, force_student_id_binding, updated_at
    ) VALUES (
      @id, @announcement, @bookingPolicy, @emergencyContactsJson, @forceStudentIdBinding, @updatedAt
    )
  `);

  const insertAppointment = database.prepare(`
    INSERT OR IGNORE INTO appointments (
      id, student_id, counselor_id, schedule_slot_id, issue_entry_type, consult_mode, status, remark, cancel_reason, created_at, updated_at
    ) VALUES (
      @id, @studentId, @counselorId, @scheduleSlotId, @issueEntryType, @consultMode, @status, @remark, @cancelReason, @createdAt, @updatedAt
    )
  `);

  const insertSessionRecord = database.prepare(`
    INSERT OR IGNORE INTO session_records (
      id, appointment_id, issue_type, emotion_level, risk_level, need_follow_up, summary_note, private_note, created_at, updated_at
    ) VALUES (
      @id, @appointmentId, @issueType, @emotionLevel, @riskLevel, @needFollowUp, @summaryNote, @privateNote, @createdAt, @updatedAt
    )
  `);

  const insertRisk = database.prepare(`
    INSERT OR IGNORE INTO risk_flags (
      id, student_id, appointment_id, trigger_reason, level, status, assigned_to, next_follow_up_at, created_at, updated_at
    ) VALUES (
      @id, @studentId, @appointmentId, @triggerReason, @level, @status, @assignedTo, @nextFollowUpAt, @createdAt, @updatedAt
    )
  `);

  const insertAuditLog = database.prepare(`
    INSERT OR IGNORE INTO audit_logs (
      id, operator_id, operator_role, action_type, target_type, target_id, detail, created_at
    ) VALUES (
      @id, @operatorId, @operatorRole, @actionType, @targetType, @targetId, @detail, @createdAt
    )
  `);

  runInTransaction(() => {
    insertUser.run({
      id: currentStudent.id,
      role: currentStudent.role,
      displayName: currentStudent.displayName,
      maskedDisplayName: currentStudent.maskedDisplayName,
      schoolId: currentStudent.schoolId ?? null,
      college: currentStudent.college ?? null,
      visibilityLevel: currentStudent.visibilityLevel,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    counselorUsers.forEach((user) => {
      insertUser.run({
        id: user.id,
        role: user.role,
        displayName: user.displayName,
        maskedDisplayName: user.maskedDisplayName,
        schoolId: user.schoolId,
        college: null,
        visibilityLevel: user.visibilityLevel,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });

    counselorsFixture.forEach((counselor) => {
      insertCounselor.run({
        id: counselor.id,
        userId: counselorUserMap[counselor.id],
        displayName: counselor.displayName,
        specialtyJson: JSON.stringify(counselor.specialty),
        intro: counselor.intro,
        gender: counselor.gender ?? null,
        nextAvailableSlot: counselor.nextAvailableSlot,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });

    scheduleFixture.forEach((slot) => {
      insertSchedule.run({
        id: slot.id,
        counselorId: slot.counselorId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        available: slot.available ? 1 : 0,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });

    insertConfig.run({
      id: "default",
      announcement: publicConfigFixture.announcement,
      bookingPolicy: publicConfigFixture.bookingPolicy,
      emergencyContactsJson: JSON.stringify(publicConfigFixture.emergencyContacts),
      forceStudentIdBinding: publicConfigFixture.forceStudentIdBinding ? 1 : 0,
      updatedAt: timestamp
    });

    appointmentsFixture.forEach((appointment) => {
      insertAppointment.run({
        id: appointment.id,
        studentId: appointment.studentId,
        counselorId: appointment.counselorId,
        scheduleSlotId: appointment.scheduleSlotId,
        issueEntryType: appointment.issueEntryType,
        consultMode: appointment.consultMode,
        status: appointment.status,
        remark: appointment.remark ?? null,
        cancelReason: appointment.cancelReason ?? null,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      });
    });

    sessionRecordsFixture.forEach((record) => {
      insertSessionRecord.run({
        id: record.id,
        appointmentId: record.appointmentId,
        issueType: record.issueType,
        emotionLevel: record.emotionLevel,
        riskLevel: record.riskLevel,
        needFollowUp: record.needFollowUp ? 1 : 0,
        summaryNote: record.summaryNote,
        privateNote: record.privateNote ?? null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      });
    });

    risksFixture.forEach((risk) => {
      insertRisk.run({
        id: risk.id,
        studentId: risk.studentId,
        appointmentId: risk.appointmentId ?? null,
        triggerReason: risk.triggerReason,
        level: risk.level,
        status: risk.status,
        assignedTo: risk.assignedTo ?? null,
        nextFollowUpAt: risk.nextFollowUpAt ?? null,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      });
    });

    auditLogsFixture.forEach((log) => {
      insertAuditLog.run({
        id: log.id,
        operatorId: log.operatorId,
        operatorRole: log.operatorRole,
        actionType: log.actionType,
        targetType: log.targetType,
        targetId: log.targetId,
        detail: log.detail ?? null,
        createdAt: log.createdAt
      });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
  console.log("Database seed completed.");
}
