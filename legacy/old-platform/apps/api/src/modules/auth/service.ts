import { runInTransaction } from "../../db/client";
import type { RequestActor } from "../../lib/actor";
import { getPublicConfigRecord } from "../../repositories/configs-repository";
import {
  findActiveTeacherIdentityByVerifyInfo,
  findActiveTeacherIdentityByWorkId,
  getCounselorDetailByUserId,
  getCurrentStudentProfile,
  getUserProfileById,
  updateCurrentStudentProfile,
  updateUserIdentityProfile
} from "../../repositories/reference-repository";
import { appendAuditLog } from "../shared/audit";

interface PhoneVerifyInfo {
  phoneNumber: string;
  phoneMask: string;
  openid: string;
}

function resolvePhoneVerifyInfo(code: string, roleHint?: "student" | "teacher"): PhoneVerifyInfo {
  const normalizedCode = code.trim().toLowerCase();
  const shouldUseTeacherMock =
    roleHint === "teacher" ||
    normalizedCode.includes("teacher") ||
    normalizedCode.includes("counselor");

  // Local stand-in for WeChat code2Verifyinfo. In production, this function
  // must call WeChat and return the verified phone/openid from that response.
  if (shouldUseTeacherMock) {
    return {
      phoneNumber: "13900002026",
      phoneMask: "139****2026",
      openid: "teacher-openid-001"
    };
  }

  return {
    phoneNumber: "13800002468",
    phoneMask: "138****2468",
    openid: "student-openid-001"
  };
}

export function getAuthSession(actor: RequestActor) {
  const profile = getUserProfileById(actor.operatorId);

  if (!profile) {
    throw new Error("当前登录身份不存在。");
  }

  if (actor.operatorRole === "counselor") {
    return {
      role: "teacher",
      profile,
      counselor: getCounselorDetailByUserId(actor.operatorId).counselor
    };
  }

  return {
    role: profile.role,
    profile
  };
}

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

export function verifyPhoneOneClickCode(code: string, roleHint?: "student" | "teacher") {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    throw new Error("一键登录凭证不能为空。");
  }

  const verifyInfo = resolvePhoneVerifyInfo(normalizedCode, roleHint);
  const teacherIdentity = findActiveTeacherIdentityByVerifyInfo(verifyInfo);

  if (teacherIdentity) {
    return runInTransaction(() => {
      const profile = getUserProfileById(teacherIdentity.userId);

      if (!profile) {
        throw new Error("教师账号状态异常，请联系管理员。");
      }

      appendAuditLog(
        {
          operatorId: teacherIdentity.userId,
          operatorRole: "counselor"
        },
        "teacher.phone_one_click.verify",
        "counselor_profile",
        teacherIdentity.counselorId,
        "Teacher completed one-click phone login verification from miniapp."
      );

      return {
        token: "mock-teacher-token",
        role: "teacher",
        profile,
        counselor: getCounselorDetailByUserId(teacherIdentity.userId).counselor,
        phoneMask: teacherIdentity.phoneMask,
        verificationMethod: "phone_one_click"
      };
    });
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
      role: "student",
      profile,
      phoneMask: verifyInfo.phoneMask,
      verificationMethod: "phone_one_click"
    };
  });
}

export function verifyTeacherLogin(payload: {
  displayName: string;
  workId: string;
  college: string;
  phone: string;
}) {
  const teacherIdentity = findActiveTeacherIdentityByWorkId(payload.workId);

  if (!teacherIdentity) {
    throw new Error("暂未找到已开通的教师身份，请联系管理员开通或核对工号。");
  }

  if (payload.phone.trim() !== teacherIdentity.phoneNumber) {
    throw new Error("手机号与教师名单不匹配，请使用已登记手机号登录。");
  }

  return runInTransaction(() => {
    const profile = updateUserIdentityProfile(teacherIdentity.userId, {
      displayName: payload.displayName,
      schoolId: payload.workId,
      college: payload.college
    });
    const counselor = getCounselorDetailByUserId(teacherIdentity.userId).counselor;

    appendAuditLog(
      {
        operatorId: teacherIdentity.userId,
        operatorRole: "counselor"
      },
      "teacher.binding.login",
      "counselor_profile",
      counselor?.id ?? teacherIdentity.counselorId,
      "Teacher completed admin-preprovisioned identity login from miniapp."
    );

    return {
      token: "mock-teacher-token",
      role: "teacher",
      profile,
      counselor
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
