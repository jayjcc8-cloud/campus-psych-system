import type { AppointmentStatus, RiskLevel, RiskProcessStatus, UserRole } from "./types";

export const USER_ROLES: UserRole[] = ["student", "counselor", "admin"];

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "expired"
];

export const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

export const RISK_PROCESS_STATUSES: RiskProcessStatus[] = [
  "pending",
  "in_progress",
  "processed",
  "closed"
];

