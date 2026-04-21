import { runInTransaction } from "../../db/client";
import type { RequestActor } from "../../lib/actor";
import { getPublicConfigRecord } from "../../repositories/configs-repository";
import {
  getCurrentStudentProfile,
  updateCurrentStudentProfile
} from "../../repositories/reference-repository";
import { appendAuditLog } from "../shared/audit";

export function getStudentBootstrap(studentId: string) {
  const profile = getCurrentStudentProfile(studentId);
  const publicConfig = getPublicConfigRecord();

  return {
    profile,
    publicConfig,
    requirements: {
      privacyNoticeRequired: true,
      userAgreementRequired: true,
      informedConsentRequired: true,
      studentIdBindingRequired: publicConfig.forceStudentIdBinding && !profile.schoolId
    }
  };
}

export function verifyPhoneOneClickCode(code: string) {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    throw new Error("一键登录凭证不能为空。");
  }

  const profile = getCurrentStudentProfile();

  return runInTransaction(() => {
    appendAuditLog(
      {
        operatorId: profile.id,
        operatorRole: "student"
      },
      "student.phone_one_click.verify",
      "student_profile",
      profile.id,
      "Student completed one-click phone login verification from miniapp."
    );

    return {
      token: "mock-token",
      profile,
      phoneMask: "138****2468",
      verificationMethod: "phone_one_click"
    };
  });
}

export function updateStudentBinding(
  studentId: string,
  payload: { schoolId: string; displayName: string; college: string },
  actor: RequestActor
) {
  return runInTransaction(() => {
    const profile = updateCurrentStudentProfile(studentId, payload);

    appendAuditLog(
      actor,
      "student.binding.update",
      "student_profile",
      profile.id,
      "Student completed school identity binding from miniapp."
    );

    return profile;
  });
}
