import Taro from "@tarojs/taro";

const setupStorageKey = "student_setup_state_v1";

const defaultSetupState = {
  privacyAcceptedAt: "",
  agreementAcceptedAt: "",
  consentAcceptedAt: ""
};

export function getStudentSetupState() {
  const storedValue = Taro.getStorageSync(setupStorageKey);

  if (!storedValue || typeof storedValue !== "object") {
    return { ...defaultSetupState };
  }

  return {
    ...defaultSetupState,
    ...storedValue
  };
}

export function markStudentSetupAccepted(field) {
  const nextState = {
    ...getStudentSetupState(),
    [field]: new Date().toISOString()
  };

  Taro.setStorageSync(setupStorageKey, nextState);
  return nextState;
}

export function clearStudentSetupState() {
  Taro.removeStorageSync(setupStorageKey);
}

export function getPendingSetupItems(bootstrap) {
  const setupState = getStudentSetupState();
  const pendingItems = [];

  if (bootstrap?.requirements?.privacyNoticeRequired && !setupState.privacyAcceptedAt) {
    pendingItems.push("privacy");
  }

  if (bootstrap?.requirements?.userAgreementRequired && !setupState.agreementAcceptedAt) {
    pendingItems.push("agreement");
  }

  if (bootstrap?.requirements?.informedConsentRequired && !setupState.consentAcceptedAt) {
    pendingItems.push("consent");
  }

  if (bootstrap?.requirements?.studentIdBindingRequired) {
    pendingItems.push("binding");
  }

  return pendingItems;
}

export function getSetupCompletionSummary(bootstrap) {
  const pendingItems = getPendingSetupItems(bootstrap);

  return {
    pendingItems,
    completed: pendingItems.length === 0
  };
}

export function getBindingRequirementSummary(bootstrap) {
  const bindingRequired = Boolean(bootstrap?.requirements?.studentIdBindingRequired);
  const bindingCompleted = Boolean(bootstrap?.profile?.schoolId);
  const blocking = bindingRequired && !bindingCompleted;

  return {
    bindingRequired,
    bindingCompleted,
    blocking
  };
}

export function getRegistrationSummary(bootstrap) {
  const profile = bootstrap?.profile ?? {};
  const displayNameCompleted = Boolean(profile.displayName?.trim());
  const collegeCompleted = Boolean(profile.college?.trim());
  const schoolIdCompleted = Boolean(profile.schoolId?.trim());
  const completed = displayNameCompleted && collegeCompleted && schoolIdCompleted;

  return {
    displayNameCompleted,
    collegeCompleted,
    schoolIdCompleted,
    completed,
    blocking: !completed
  };
}

const setupRouteMap = {
  privacy: "/pages/privacy/index",
  agreement: "/pages/agreement/index",
  consent: "/pages/consent/index",
  binding: "/pages/binding/index"
};

const setupLabelMap = {
  privacy: "隐私说明",
  agreement: "用户协议",
  consent: "知情提示",
  binding: "身份绑定"
};

export function getSetupRoute(item) {
  return setupRouteMap[item] ?? "";
}

export function getSetupLabel(item) {
  return setupLabelMap[item] ?? item;
}
