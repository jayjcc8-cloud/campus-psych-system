import Taro from "@tarojs/taro";
import { clearAuthSession } from "./auth-session";
import { clearPendingIntent } from "./navigation-intent";
import { clearRegistrationFeedback } from "./registration-feedback";
import { clearRoleMode } from "./role-mode";
import { clearStudentSetupState } from "./student-setup";

export function clearLocalStudentSession() {
  clearAuthSession();
  clearStudentSetupState();
  clearPendingIntent();
  clearRegistrationFeedback();
  clearRoleMode();
  Taro.removeStorageSync("preferred_issue_type");
}
