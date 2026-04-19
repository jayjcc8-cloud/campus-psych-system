import Taro from "@tarojs/taro";

const preferredIssueTypeKey = "preferred_issue_type";

export function openCounselorsTab(issueType) {
  if (issueType) {
    Taro.setStorageSync(preferredIssueTypeKey, issueType);
  } else {
    Taro.removeStorageSync(preferredIssueTypeKey);
  }

  return Taro.switchTab({ url: "/pages/counselors/index" });
}

export function consumePreferredIssueType() {
  const value = Taro.getStorageSync(preferredIssueTypeKey);
  Taro.removeStorageSync(preferredIssueTypeKey);
  return typeof value === "string" ? value : "";
}

export function switchStudentTab(url) {
  return Taro.switchTab({ url });
}
