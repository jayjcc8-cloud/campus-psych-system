import Taro from "@tarojs/taro";

const registrationFeedbackKey = "registration_feedback_v1";

export function saveRegistrationFeedback(payload = {}) {
  Taro.setStorageSync(registrationFeedbackKey, {
    message: payload.message || "注册完成，现在可以正常使用功能了。",
    createdAt: new Date().toISOString()
  });
}

export function consumeRegistrationFeedback() {
  const value = Taro.getStorageSync(registrationFeedbackKey);
  Taro.removeStorageSync(registrationFeedbackKey);

  if (!value || typeof value !== "object") {
    return null;
  }

  return value;
}

export function clearRegistrationFeedback() {
  Taro.removeStorageSync(registrationFeedbackKey);
}
