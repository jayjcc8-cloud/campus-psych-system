import Taro from "@tarojs/taro";
import { studentProfileFixture } from "./fixtures";

const authSessionKey = "miniapp_auth_session_v1";
const loggedOutKey = "miniapp_logged_out_v1";

export function getAuthSession() {
  const storedValue = Taro.getStorageSync(authSessionKey);

  if (!storedValue || typeof storedValue !== "object") {
    return null;
  }

  return storedValue;
}

export function saveAuthSession(session) {
  Taro.removeStorageSync(loggedOutKey);
  Taro.setStorageSync(authSessionKey, session);
  return session;
}

export function clearAuthSession() {
  Taro.removeStorageSync(authSessionKey);
  Taro.setStorageSync(loggedOutKey, true);
}

export function isLoggedOut() {
  return Taro.getStorageSync(loggedOutKey) === true;
}

export function clearLoggedOutState() {
  Taro.removeStorageSync(loggedOutKey);
}

export function getCurrentStudentId() {
  return getAuthSession()?.profile?.id ?? studentProfileFixture.id;
}

export function getCurrentStudentProfile() {
  return getAuthSession()?.profile ?? studentProfileFixture;
}
