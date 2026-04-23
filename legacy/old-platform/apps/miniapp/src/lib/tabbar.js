import Taro from "@tarojs/taro";

const preferredIssueTypeKey = "preferred_issue_type";

function getCurrentPage() {
  const instancePage = Taro.getCurrentInstance?.()?.page;

  if (instancePage) {
    return instancePage;
  }

  if (typeof getCurrentPages !== "function") {
    return null;
  }

  const pages = getCurrentPages();
  return pages[pages.length - 1] ?? null;
}

export function refreshRoleTabBar() {
  const tabBar = getCurrentPage()?.getTabBar?.();

  if (tabBar?.refresh) {
    tabBar.refresh();
  }
}

export function openCounselorsTab(issueType) {
  if (issueType) {
    Taro.setStorageSync(preferredIssueTypeKey, issueType);
  } else {
    Taro.removeStorageSync(preferredIssueTypeKey);
  }

  return Taro.switchTab({ url: "/pages/counselors/index" }).then(() => {
    refreshRoleTabBar();
  });
}

export function openTeacherAppointmentsTab() {
  return Taro.switchTab({ url: "/pages/teacher/appointments/index" }).then(() => {
    refreshRoleTabBar();
  });
}

export function consumePreferredIssueType() {
  const value = Taro.getStorageSync(preferredIssueTypeKey);
  Taro.removeStorageSync(preferredIssueTypeKey);
  return typeof value === "string" ? value : "";
}

export function switchStudentTab(url) {
  return Taro.switchTab({ url }).then(() => {
    refreshRoleTabBar();
  });
}
