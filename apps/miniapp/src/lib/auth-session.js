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
  const normalizedSession = {
    ...session,
    role: session.role ?? "student"
  };

  Taro.setStorageSync(authSessionKey, normalizedSession);
  return normalizedSession;
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
  const session = getAuthSession();

  if (session && (!session.role || session.role === "student")) {
    return session.profile?.id ?? studentProfileFixture.id;
  }

  return studentProfileFixture.id;
}

export function getCurrentStudentProfile() {
  const session = getAuthSession();

  if (session && (!session.role || session.role === "student")) {
    return session.profile ?? studentProfileFixture;
  }

  return studentProfileFixture;
}

export function getAuthRole() {
  const session = getAuthSession();

  if (session?.role === "teacher" || session?.role === "counselor") {
    return "teacher";
  }

  if (session && (!session.role || session.role === "student")) {
    return "student";
  }

  return "";
}

export function isStudentSession() {
  return getAuthRole() === "student";
}

export function isTeacherSession() {
  return getAuthRole() === "teacher";
}
