import Taro from "@tarojs/taro";

const appointmentFocusKey = "appointment_focus_v1";

export function saveAppointmentFocus(payload = {}) {
  Taro.setStorageSync(appointmentFocusKey, {
    status: payload.status || "pending",
    appointmentId: payload.appointmentId || "",
    message: payload.message || "预约已提交，等待咨询老师确认。",
    createdAt: new Date().toISOString()
  });
}

export function consumeAppointmentFocus() {
  const value = Taro.getStorageSync(appointmentFocusKey);
  Taro.removeStorageSync(appointmentFocusKey);

  if (!value || typeof value !== "object") {
    return null;
  }

  return value;
}
