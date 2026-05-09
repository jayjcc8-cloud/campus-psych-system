import { getUserToken } from "../api/client";
import { openPage } from "./navigation";

function currentRoute() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as any;
  if (!current?.route) {
    return "/pages/index/index";
  }

  const query = current.options
    ? Object.entries(current.options)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ""))}`)
        .join("&")
    : "";

  return `/${current.route}${query ? `?${query}` : ""}`;
}

export function requireUserLogin(actionName = "继续操作") {
  if (getUserToken()) {
    return true;
  }

  const redirect = currentRoute();
  uni.showModal({
    title: "需要登录",
    content: `${actionName}会生成个人记录。为了减少恶意提交并同步预约状态，请先使用邮箱登录或注册。`,
    confirmText: "去登录",
    cancelText: "先看看",
    success(result) {
      if (result.confirm) {
        openPage(`/pages/login/index?redirect=${encodeURIComponent(redirect)}`);
      }
    }
  });
  return false;
}
