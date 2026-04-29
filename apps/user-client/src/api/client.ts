import type { AssessmentSummary, CounselorProfile, SupportRequestSummary, SupportSlot } from "@teacher-support/shared";
import { getAnonymousSessionId } from "../utils/session";

function resolveApiBaseUrl() {
  // H5 follows the current host so local/LAN access stays consistent.
  // Mini Program keeps using the local API host configured for development.
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  return "http://127.0.0.1:4000";
}

const API_BASE_URL = resolveApiBaseUrl();

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
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
        reject(new Error(payload?.message ?? "请求暂时没有成功"));
      },
      fail(error) {
        reject(new Error(error.errMsg || "网络连接暂时不可用"));
      }
    });
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
  return request<{ id: string; receiptCode: string; status: string }>("/support/requests", {
    method: "POST",
    data: payload
  });
}

export function createAssessment(payload: { preferredName?: string; answers: Record<string, number> }) {
  return request<AssessmentSummary>("/assessments", {
    method: "POST",
    data: payload
  });
}

export function getAssessmentByReceipt(receiptCode: string) {
  return request<AssessmentSummary>(`/assessments/${encodeURIComponent(receiptCode)}`);
}

export function getRequestByReceipt(receiptCode: string) {
  return request<SupportRequestSummary>(`/support/requests/${encodeURIComponent(receiptCode)}`);
}

export function withdrawRequest(receiptCode: string) {
  return request<SupportRequestSummary>(`/support/requests/${encodeURIComponent(receiptCode)}/withdraw`, {
    method: "PATCH"
  });
}
