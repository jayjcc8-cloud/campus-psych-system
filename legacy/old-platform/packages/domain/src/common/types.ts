export type UserRole = "student" | "counselor" | "admin";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "expired";

export type RiskLevel = "low" | "medium" | "high";

export type RiskProcessStatus = "pending" | "in_progress" | "processed" | "closed";

export type ConsultMode = "offline";

export type IdentityVisibilityLevel = "masked" | "authorized";

export type EmotionLevel = 1 | 2 | 3 | 4 | 5;

export type IssueType =
  | "academic_pressure"
  | "sleep"
  | "relationship"
  | "emotion"
  | "career"
  | "other";

