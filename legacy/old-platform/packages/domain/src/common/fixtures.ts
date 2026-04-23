import type { AppointmentSummary } from "../appointments/types";
import type { UserProfile } from "../auth/types";
import type { AuditLog } from "./audit";
import type { PublicConfig } from "../configs/types";
import type { Counselor, CounselorScheduleSlot } from "../counselors/types";
import type { RiskFlag } from "../risks/types";
import type { SessionRecord } from "../session-records/types";
import type { OverviewMetrics } from "../statistics/types";
import type { Appointment } from "../appointments/types";

export const currentStudent: UserProfile = {
  id: "student-001",
  role: "student",
  displayName: "林晓雨",
  maskedDisplayName: "晓雨同学",
  schoolId: "20260001",
  college: "计算机学院",
  visibilityLevel: "masked"
};

export const counselorsFixture: Counselor[] = [
  {
    id: "counselor-001",
    displayName: "Lin",
    specialty: ["academic_pressure", "relationship"],
    intro: "Focuses on transition stress and relationship-related support.",
    gender: "female",
    nextAvailableSlot: "2026-04-22T09:00:00+08:00"
  },
  {
    id: "counselor-002",
    displayName: "Chen",
    specialty: ["sleep", "emotion"],
    intro: "Supports students navigating burnout, sleep, and emotional regulation.",
    gender: "male",
    nextAvailableSlot: "2026-04-23T14:00:00+08:00"
  }
];

export const scheduleFixture: CounselorScheduleSlot[] = [
  {
    id: "slot-001",
    counselorId: "counselor-001",
    startTime: "2026-04-22T09:00:00+08:00",
    endTime: "2026-04-22T10:00:00+08:00",
    capacity: 1,
    available: true
  },
  {
    id: "slot-002",
    counselorId: "counselor-002",
    startTime: "2026-04-23T14:00:00+08:00",
    endTime: "2026-04-23T15:00:00+08:00",
    capacity: 1,
    available: true
  }
];

export const appointmentsFixture: Appointment[] = [
  {
    id: "appt-001",
    studentId: "student-001",
    counselorId: "counselor-001",
    scheduleSlotId: "slot-001",
    issueEntryType: "academic_pressure",
    consultMode: "offline",
    status: "pending",
    remark: "最近论文压力较大，希望获得支持。",
    createdAt: "2026-04-20T09:30:00+08:00",
    updatedAt: "2026-04-20T09:30:00+08:00"
  }
];

export const sessionRecordsFixture: SessionRecord[] = [
  {
    id: "record-001",
    appointmentId: "appt-001",
    issueType: "academic_pressure",
    emotionLevel: 4,
    riskLevel: "medium",
    needFollowUp: true,
    summaryNote: "Student reports a sustained thesis deadline pressure.",
    privateNote: "Observe concentration and sleep pattern next session.",
    createdAt: "2026-04-20T10:30:00+08:00",
    updatedAt: "2026-04-20T10:30:00+08:00"
  }
];

export const risksFixture: RiskFlag[] = [
  {
    id: "risk-001",
    studentId: "student-001",
    appointmentId: "appt-001",
    triggerReason: "Manual counselor review after structured session record.",
    level: "medium",
    status: "in_progress",
    assignedTo: "counselor-001",
    nextFollowUpAt: "2026-04-24T10:00:00+08:00",
    createdAt: "2026-04-20T10:40:00+08:00",
    updatedAt: "2026-04-20T10:40:00+08:00"
  }
];

export const publicConfigFixture: PublicConfig = {
  announcement: "工作日线下心理支持预约已开放，可按需选择咨询老师和可约时段。",
  bookingPolicy: "每位学生最多保留 2 个进行中的预约；如无法参加，请提前取消。",
  emergencyContacts: [
    { label: "校心理支持中心", phone: "021-55551234" },
    { label: "校医院值班电话", phone: "021-55555678" }
  ],
  forceStudentIdBinding: false
};

export const overviewMetricsFixture: OverviewMetrics = {
  appointmentsThisMonth: 86,
  completedSessionsThisMonth: 61,
  activeRiskFlags: 4,
  averageLeadTimeHours: 36
};

export const appointmentSummaryFixture: AppointmentSummary = {
  total: 86,
  pending: 14,
  confirmed: 21,
  completed: 47,
  flagged: 4
};

export const auditLogsFixture: AuditLog[] = [
  {
    id: "audit-001",
    operatorId: "admin-001",
    operatorRole: "admin",
    actionType: "config.view",
    targetType: "public_config",
    targetId: "default",
    detail: "Initial bootstrap fixture created for admin console review.",
    createdAt: "2026-04-20T10:50:00+08:00"
  }
];
