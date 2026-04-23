import type { AuditLogEntry, SupportRequestSummary, SupportSlot } from "@teacher-support/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";
const tokenKey = "teacher_support_admin_token";

export function getToken() {
  return localStorage.getItem(tokenKey) ?? "";
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "请求失败");
  }

  return response.json();
}

export function login(username: string, password: string) {
  return request<{ token: string; user: { displayName: string } }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export function listRequests() {
  return request<SupportRequestSummary[]>("/admin/support-requests");
}

export function updateRequest(id: string, status: "viewed" | "noted" | "closed" | "spam") {
  return request<SupportRequestSummary>(`/admin/support-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function listEvents(id: string) {
  return request<Array<{ id: string; eventType: string; detail?: string; createdAt: string }>>(
    `/admin/support-requests/${id}/events`
  );
}

export function listSlots() {
  return request<SupportSlot[]>("/admin/support-slots");
}

export function createSlot(input: { startTime: string; endTime: string; capacity: number; available?: boolean }) {
  return request<SupportSlot>("/admin/support-slots", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateSlot(
  id: string,
  input: Partial<{ startTime: string; endTime: string; capacity: number; available: boolean }>
) {
  return request<SupportSlot>(`/admin/support-slots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function listAuditLogs() {
  return request<AuditLogEntry[]>("/admin/audit-logs");
}
