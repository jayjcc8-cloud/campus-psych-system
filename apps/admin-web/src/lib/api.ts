import type {
  Appointment,
  AppointmentStatus,
  AppointmentSummary,
  AuditLog,
  Counselor,
  EmotionLevel,
  IssueType,
  OverviewMetrics,
  PublicConfig,
  PublicConfigUpdate,
  RiskFlag,
  RiskLevel,
  RiskProcessStatus,
  SessionRecord
} from "@campus-psych/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "admin",
      "x-user-id": "admin-bootstrap"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | { message?: string }) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : `Request failed for ${path}`;
    throw new Error(message);
  }

  return payload as T;
}

export function getOverviewMetrics() {
  return request<OverviewMetrics>("/statistics/overview");
}

export function getAppointmentSummary() {
  return request<AppointmentSummary>("/appointments/summary");
}

export function getAppointments() {
  return request<Appointment[]>("/appointments");
}

export function updateAppointmentStatus(id: string, nextStatus: AppointmentStatus) {
  return request<Appointment>(`/appointments/${id}/status`, {
    method: "PATCH",
    body: { nextStatus }
  });
}

export function getCounselors() {
  return request<Counselor[]>("/counselors");
}

export function getRiskFlags() {
  return request<Array<RiskFlag & { requiresAdminAttention?: boolean }>>("/risk-flags");
}

export function updateRiskFlag(
  id: string,
  payload: {
    status?: RiskProcessStatus;
    assignedTo?: string;
    nextFollowUpAt?: string;
  }
) {
  return request<RiskFlag & { requiresAdminAttention?: boolean }>(`/risk-flags/${id}`, {
    method: "PATCH",
    body: payload
  });
}

export function getPublicConfig() {
  return request<PublicConfig>("/configs/public");
}

export function updatePublicConfig(payload: PublicConfigUpdate) {
  return request<PublicConfig>("/configs/public", {
    method: "PATCH",
    body: payload
  });
}

export function getSessionRecords() {
  return request<SessionRecord[]>("/session-records");
}

export function createSessionRecord(payload: {
  appointmentId: string;
  issueType: IssueType;
  emotionLevel: EmotionLevel;
  riskLevel: RiskLevel;
  needFollowUp: boolean;
  summaryNote: string;
  privateNote?: string;
}) {
  return request<SessionRecord>("/session-records", {
    method: "POST",
    body: payload
  });
}

export function getAuditLogs() {
  return request<AuditLog[]>("/audit-logs");
}
