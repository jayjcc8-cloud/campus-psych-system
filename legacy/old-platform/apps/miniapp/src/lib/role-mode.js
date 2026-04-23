import Taro from "@tarojs/taro";
import { getAuthSession, getAuthRole, saveAuthSession } from "./auth-session";

const roleModeKey = "miniapp_role_mode_v1";
const teacherProfile = {
  id: "counselor-user-001",
  displayName: "林老师",
  maskedDisplayName: "林老师",
  title: "咨询老师"
};

export function getRoleMode() {
  const authRole = getAuthRole();
  return authRole === "teacher" ? "teacher" : "student";
}

export function setRoleMode(role) {
  Taro.setStorageSync(roleModeKey, role === "teacher" ? "teacher" : "student");
}

export function clearRoleMode() {
  Taro.removeStorageSync(roleModeKey);
}

export function saveStudentRoleSession(session) {
  setRoleMode("student");
  return saveAuthSession({
    ...session,
    role: "student"
  });
}

export function saveTeacherRoleSession(session = {}) {
  setRoleMode("teacher");
  return saveAuthSession({
    ...session,
    token: session.token ?? "mock-teacher-token",
    role: "teacher",
    profile: session.profile ?? teacherProfile
  });
}

export function getCurrentRoleProfile() {
  return getAuthSession()?.profile ?? null;
}
