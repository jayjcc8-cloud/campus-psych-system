import type { ConsultMode, IssueType, AppointmentStatus } from "../common/types";

export interface Appointment {
  id: string;
  studentId: string;
  counselorId: string;
  scheduleSlotId: string;
  issueEntryType: IssueType;
  consultMode: ConsultMode;
  status: AppointmentStatus;
  remark?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSummary {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  flagged: number;
}

