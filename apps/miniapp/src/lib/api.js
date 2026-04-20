import Taro from "@tarojs/taro";

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
      "x-user-id": "student-bootstrap"
    }
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const payload = response.data;
    throw new MiniappApiError(payload?.message ?? `Request failed for ${path}`);
  }

  return response.data;
}

export function getCounselors() {
  return request("/counselors");
}

export function getCounselorDetail(id) {
  return request(`/counselors/${id}`);
}

export function getMyAppointments() {
  return request("/appointments/my");
}

export function getPublicConfig() {
  return request("/configs/public");
}

export function createAppointment(payload) {
  return request("/appointments", {
    method: "POST",
    body: payload
  });
}

export function cancelAppointment(id, payload = {}) {
  return request(`/appointments/${id}/cancel`, {
    method: "PATCH",
    body: payload
  });
}
