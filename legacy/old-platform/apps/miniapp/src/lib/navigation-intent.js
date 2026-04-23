import Taro from "@tarojs/taro";

const pendingIntentKey = "pending_after_binding_path_v1";
const tabPages = new Set([
  "/pages/home/index",
  "/pages/counselors/index",
  "/pages/my/index",
  "/pages/profile/index",
  "/pages/teacher/appointments/index"
]);

export function savePendingIntent(url) {
  if (!url) {
    return;
  }

  Taro.setStorageSync(pendingIntentKey, url);
}

export function peekPendingIntent() {
  const value = Taro.getStorageSync(pendingIntentKey);
  return typeof value === "string" ? value : "";
}

export function consumePendingIntent() {
  const value = Taro.getStorageSync(pendingIntentKey);
  Taro.removeStorageSync(pendingIntentKey);
  return typeof value === "string" ? value : "";
}

export function clearPendingIntent() {
  Taro.removeStorageSync(pendingIntentKey);
}

export function navigateByIntent(url, fallbackUrl = "/pages/profile/index") {
  const targetUrl = url || fallbackUrl;

  if (tabPages.has(targetUrl)) {
    return Taro.switchTab({ url: targetUrl });
  }

  return Taro.redirectTo({ url: targetUrl });
}
