import Taro from "@tarojs/taro";
import { getAuthSession, getCurrentStudentId, isLoggedOut, isStudentSession } from "./auth-session";
import { studentBootstrapFixture } from "./fixtures";
import { saveStudentRoleSession } from "./role-mode";

const API_BASE_URL = "http://127.0.0.1:4000";

export class MiniappApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "MiniappApiError";
  }
}

async function request(path, options = {}) {
  const response = await Taro.request({
    url: `${API_BASE_URL}${path}`,
    method: options.method ?? "GET",
    data: options.body,
    header: {
      "Content-Type": "application/json",
      "x-user-role": "student",
      "x-user-id": getCurrentStudentId()
    }
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const payload = response.data;
    throw new MiniappApiError(payload?.message ?? `Request failed for ${path}`);
  }

  return response.data;
}

export async function loginStudent() {
  const response = await Taro.request({
    url: `${API_BASE_URL}/auth/wechat/login`,
    method: "POST",
    data: {},
    header: {
      "Content-Type": "application/json"
    }
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const payload = response.data;
    throw new MiniappApiError(payload?.message ?? "Student login failed.");
  }

  return saveStudentRoleSession(response.data);
}

export async function phoneOneClickLogin(code) {
  const response = await Taro.request({
    url: `${API_BASE_URL}/auth/wechat/phone-one-click`,
    method: "POST",
    data: { code },
    header: {
      "Content-Type": "application/json"
    }
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const payload = response.data;
    throw new MiniappApiError(payload?.message ?? "Phone one-click login failed.");
  }

  return saveStudentRoleSession(response.data);
}

export function getCounselors() {
  return request("/counselors");
}

export function getCounselorDetail(id) {
  return request(`/counselors/${id}`);
}

export function getMyAppointments() {
  if (!getAuthSession() || isLoggedOut() || !isStudentSession()) {
    return Promise.resolve([]);
  }

  return request("/appointments/my");
}

export function getPublicConfig() {
  return request("/configs/public");
}

export function createAppointment(payload) {
  if (!getAuthSession() || isLoggedOut() || !isStudentSession()) {
    return Promise.reject(new MiniappApiError("请先完成注册登录。"));
  }

  return request("/appointments", {
    method: "POST",
    body: payload
  });
}

export function cancelAppointment(id, payload = {}) {
  if (!getAuthSession() || isLoggedOut() || !isStudentSession()) {
    return Promise.reject(new MiniappApiError("请先完成注册登录。"));
  }

  return request(`/appointments/${id}/cancel`, {
    method: "PATCH",
    body: payload
  });
}

export function getStudentBootstrap() {
  if (!getAuthSession() || isLoggedOut() || !isStudentSession()) {
    return Promise.resolve(studentBootstrapFixture);
  }

  return request("/auth/bootstrap");
}

export function updateStudentProfile(payload) {
  return request("/auth/profile", {
    method: "PATCH",
    body: payload
  }).then((profile) => {
    saveStudentRoleSession({
      token: getAuthSession()?.token ?? "local-registration-token",
      profile
    });

    return profile;
  });
}
