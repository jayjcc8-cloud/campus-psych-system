import type { SupportRequestSummary, SupportSlot } from "@teacher-support/shared";
import { getAnonymousSessionId } from "../utils/session";

const API_BASE_URL = "http://127.0.0.1:4000";

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

export function createRequest(payload: {
  slotId: string;
  issueType: string;
  contactEmail?: string;
  contactNote?: string;
  remark?: string;
}) {
  return request<{ id: string; receiptCode: string; status: string }>("/support/requests", {
    method: "POST",
    data: payload
  });
}

export function getRequestByReceipt(receiptCode: string) {
  return request<SupportRequestSummary>(`/support/requests/${encodeURIComponent(receiptCode)}`);
}

export function withdrawRequest(receiptCode: string) {
  return request<SupportRequestSummary>(`/support/requests/${encodeURIComponent(receiptCode)}/withdraw`, {
    method: "PATCH"
  });
}
