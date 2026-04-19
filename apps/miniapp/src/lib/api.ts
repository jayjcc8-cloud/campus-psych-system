import type { Appointment, Counselor, PublicConfig } from "@campus-psych/domain";
import Taro from "@tarojs/taro";

const API_BASE_URL = "http://127.0.0.1:4000";

async function request<T>(path: string): Promise<T> {
  const response = await Taro.request<T>({
    url: `${API_BASE_URL}${path}`,
    method: "GET",
    header: {
      "x-user-role": "student",
      "x-user-id": "student-bootstrap"
    }
  });

  return response.data;
}

export function getCounselors() {
  return request<Counselor[]>("/counselors");
}

export function getMyAppointments() {
  return request<Appointment[]>("/appointments/my");
}

export function getPublicConfig() {
  return request<PublicConfig>("/configs/public");
}
