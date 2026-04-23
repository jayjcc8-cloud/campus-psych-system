import Taro from "@tarojs/taro";
import { MiniappApiError } from "./api";
import { getAuthSession, isTeacherSession } from "./auth-session";

const API_BASE_URL = "http://127.0.0.1:4000";

async function teacherRequest(path, options = {}) {
  if (!isTeacherSession()) {
    throw new MiniappApiError("请先用教师身份登录。");
  }

  const teacherUserId = getAuthSession()?.profile?.id;

  const response = await Taro.request({
    url: `${API_BASE_URL}${path}`,
    method: options.method ?? "GET",
    data: options.body,
    header: {
      "Content-Type": "application/json",
      "x-user-role": "counselor",
      "x-user-id": teacherUserId
    }
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const payload = response.data;
    throw new MiniappApiError(payload?.message ?? `Request failed for ${path}`);
  }

  return response.data;
}

export function getTeacherAppointments() {
  return teacherRequest("/appointments");
}

export function getTeacherWorkspace() {
  return teacherRequest("/counselors/me");
}

export function updateTeacherProfile(payload) {
  return teacherRequest("/counselors/me", {
    method: "PATCH",
    body: payload
  });
}

export function createTeacherSchedule(payload) {
  return teacherRequest("/counselors/me/schedules", {
    method: "POST",
    body: payload
  });
}

export function updateTeacherSchedule(id, payload) {
  return teacherRequest(`/counselors/me/schedules/${id}`, {
    method: "PATCH",
    body: payload
  });
}

export function updateTeacherAppointmentStatus(id, nextStatus) {
  return teacherRequest(`/appointments/${id}/status`, {
    method: "PATCH",
    body: { nextStatus }
  });
}

export function getTeacherSessionRecords() {
  return teacherRequest("/session-records");
}

export function getTeacherRiskFlags() {
  return teacherRequest("/risk-flags");
}

export function updateTeacherRiskFlag(id, payload) {
  return teacherRequest(`/risk-flags/${id}`, {
    method: "PATCH",
    body: payload
  });
}
