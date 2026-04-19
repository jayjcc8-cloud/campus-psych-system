import type {
  Appointment,
  AppointmentSummary,
  OverviewMetrics,
  PublicConfig,
  RiskFlag
} from "@campus-psych/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "x-user-role": "admin",
      "x-user-id": "admin-bootstrap"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return response.json() as Promise<T>;
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

export function getRiskFlags() {
  return request<Array<RiskFlag & { requiresAdminAttention?: boolean }>>("/risk-flags");
}

export function getPublicConfig() {
  return request<PublicConfig>("/configs/public");
}

