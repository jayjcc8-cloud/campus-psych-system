import type {
  AssessmentSummary,
  CounselorProfile,
  PrivacyUserProfile,
  SupportRequestSummary,
  SupportSlot,
  SupportSlotMode,
  UnifiedLoginResponse
} from "@teacher-support/shared";
import { getAnonymousSessionId } from "../utils/session";

function resolveApiBaseUrl() {
  // #ifdef MP-WEIXIN
  return "http://127.0.0.1:4000";
  // #endif

  // Fallback for build tools and local previews.
  return "http://127.0.0.1:4000";
}

const API_BASE_URL = resolveApiBaseUrl();
const counselorTokenKey = "counselor_token";
const userTokenKey = "privacy_user_token";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  data?: string | Record<string, unknown> | ArrayBuffer;
  header?: Record<string, string>;
}

function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${path}`,
      method: (options.method ?? "GET") as UniNamespace.RequestOptions["method"],
      data: options.data,
      header: {
        "Content-Type": "application/json",
        "x-anonymous-session-id": getAnonymousSessionId(),
        ...(options.header ?? {})
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as T);
          return;
        }
        const payload = response.data as { message?: string } | undefined;
        reject(new ApiError(payload?.message ?? "请求暂时没有成功", response.statusCode));
      },
      fail(error) {
        const message = error.errMsg && !error.errMsg.startsWith("request:fail") ? error.errMsg : "网络连接暂时不可用";
        reject(new ApiError(message));
      }
    });
  });
}

function counselorRequest<T>(path: string, options: RequestOptions = {}) {
  return request<T>(path, {
    ...options,
    header: {
      Authorization: `Bearer ${getCounselorToken()}`,
      ...(options.header ?? {})
    }
  });
}

function userRequest<T>(path: string, options: RequestOptions = {}) {
  return request<T>(path, {
    ...options,
    header: {
      Authorization: `Bearer ${getUserToken()}`,
      ...(options.header ?? {})
    }
  });
}

export function getUserToken() {
  return uni.getStorageSync(userTokenKey) || "";
}

export function setUserToken(token: string) {
  uni.setStorageSync(userTokenKey, token);
}

export function clearUserToken() {
  uni.removeStorageSync(userTokenKey);
}

export function getCounselorToken() {
  return uni.getStorageSync(counselorTokenKey) || "";
}

export function setCounselorToken(token: string) {
  uni.setStorageSync(counselorTokenKey, token);
}

export function clearCounselorToken() {
  uni.removeStorageSync(counselorTokenKey);
}

export function logoutCurrentToken() {
  const token = getUserToken() || getCounselorToken();
  if (!token) {
    return Promise.resolve({ ok: true });
  }
  return request<{ ok: boolean }>("/auth/logout", {
    method: "POST",
    header: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function listSlots() {
  return request<SupportSlot[]>("/support/slots");
}

export function listCounselors() {
  return request<CounselorProfile[]>("/support/counselors");
}

export function getCounselor(id: string) {
  return request<CounselorProfile>(`/support/counselors/${encodeURIComponent(id)}`);
}

export function listCounselorSlots(id: string) {
  return request<SupportSlot[]>(`/support/counselors/${encodeURIComponent(id)}/slots`);
}

export function createRequest(payload: {
  counselorId: string;
  slotId: string;
  preferredName?: string;
  assessmentId?: string;
  contactEmail?: string;
  contactNote?: string;
  remark?: string;
}) {
  return userRequest<SupportRequestSummary>("/support/requests", {
    method: "POST",
    data: payload
  });
}

export function listUserAppointments() {
  return userRequest<SupportRequestSummary[]>("/user/appointments");
}

export function withdrawUserAppointment(id: string) {
  return userRequest<SupportRequestSummary>(`/user/appointments/${encodeURIComponent(id)}/withdraw`, {
    method: "PATCH"
  });
}

export function createAssessment(payload: { preferredName?: string; answers: Record<string, number> }) {
  return userRequest<AssessmentSummary>("/assessments", {
    method: "POST",
    data: payload
  });
}

export function getAssessmentByReceipt(receiptCode: string) {
  return request<AssessmentSummary>(`/assessments/${encodeURIComponent(receiptCode)}`);
}

export function counselorLogin(email: string, password: string) {
  return request<{
    token: string;
    user: { counselorId: string; displayName: string; username: string; email?: string; role: "counselor" };
  }>("/counselor/auth/login", {
    method: "POST",
    data: { email, password }
  });
}

export function unifiedLogin(identifier: string, password: string) {
  return request<UnifiedLoginResponse>("/auth/login", {
    method: "POST",
    data: { identifier, password }
  });
}

export function counselorRegister(payload: {
  password: string;
  legalName: string;
  staffId: string;
  organization: string;
  workEmail: string;
  displayName: string;
  title: string;
  intro: string;
  specialties: string[];
}) {
  return request<{ status: "pending_review"; message: string }>("/counselor/auth/register", {
    method: "POST",
    data: payload
  });
}

export function getCounselorMe() {
  return counselorRequest<CounselorProfile>("/counselor/me");
}

export function updateCounselorMe(payload: { title: string; intro: string; specialties: string[] }) {
  return counselorRequest<CounselorProfile>("/counselor/me", {
    method: "PATCH",
    data: payload
  });
}

export function listCounselorOwnSlots() {
  return counselorRequest<SupportSlot[]>("/counselor/slots");
}

export function createCounselorSlot(payload: {
  startTime: string;
  endTime: string;
  capacity: number;
  mode?: SupportSlotMode;
  location?: string;
  note?: string;
  available?: boolean;
}) {
  return counselorRequest<SupportSlot>("/counselor/slots", {
    method: "POST",
    data: payload
  });
}

export function updateCounselorSlot(
  id: string,
  payload: Partial<{
    startTime: string;
    endTime: string;
    capacity: number;
    mode: SupportSlotMode;
    location: string;
    note: string;
    available: boolean;
  }>
) {
  return counselorRequest<SupportSlot>(`/counselor/slots/${encodeURIComponent(id)}`, {
    method: "PATCH",
    data: payload
  });
}

export function deleteCounselorSlot(id: string) {
  return counselorRequest<SupportSlot>(`/counselor/slots/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function listCounselorRequests() {
  return counselorRequest<SupportRequestSummary[]>("/counselor/support-requests");
}

export function updateCounselorRequest(id: string, status: "noted" | "closed") {
  return counselorRequest<SupportRequestSummary[]>(`/counselor/support-requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    data: { status }
  });
}

export function registerPrivacyUser(payload: { email: string; password: string; preferredName?: string }) {
  return request<{ token: string; user: PrivacyUserProfile; devVerificationToken?: string }>("/user/auth/register", {
    method: "POST",
    data: payload
  });
}

export function loginPrivacyUser(email: string, password: string) {
  return request<{ token: string; user: PrivacyUserProfile }>("/user/auth/login", {
    method: "POST",
    data: { email, password }
  });
}

export function recoverPrivacyUser(payload: { privacyId: string; recoveryPhrase: string; password: string }) {
  return request<{ token: string; user: PrivacyUserProfile }>("/user/auth/recover", {
    method: "POST",
    data: payload
  });
}

export function requestEmailVerification(email: string) {
  return request<{ ok: boolean; message: string; devToken?: string }>("/auth/email-verification/request", {
    method: "POST",
    data: { email }
  });
}

export function confirmEmailVerification(token: string) {
  return request<{ ok: boolean; message: string }>("/auth/email-verification/confirm", {
    method: "POST",
    data: { token }
  });
}

export function requestPasswordReset(email: string) {
  return request<{ ok: boolean; message: string; devToken?: string }>("/auth/password-reset/request", {
    method: "POST",
    data: { email }
  });
}

export function confirmPasswordReset(token: string, password: string) {
  return request<{ ok: boolean; message: string }>("/auth/password-reset/confirm", {
    method: "POST",
    data: { token, password }
  });
}

export function getPrivacyUserMe() {
  return userRequest<PrivacyUserProfile>("/user/me");
}
