const tabPages = new Set(["/pages/index/index", "/pages/requests/index", "/pages/profile/index"]);

function normalizeUrl(url: string) {
  return url.startsWith("/") ? url : `/${url}`;
}

function parseQuery(query: string) {
  return query.split("&").reduce<Record<string, string>>((result, pair) => {
    const [key, value = ""] = pair.split("=");
    if (key) {
      result[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    return result;
  }, {});
}

export function openPage(url: string) {
  const normalized = normalizeUrl(url);
  const [path, query = ""] = normalized.split("?");

  if (tabPages.has(path)) {
    if (query) {
      uni.setStorageSync(`tab_query:${path}`, query);
    }
    uni.switchTab({ url: path });
    return;
  }

  uni.navigateTo({ url: normalized });
}

export function replacePage(url: string) {
  const normalized = normalizeUrl(url);
  const [path, query = ""] = normalized.split("?");

  if (tabPages.has(path)) {
    if (query) {
      uni.setStorageSync(`tab_query:${path}`, query);
    }
    uni.switchTab({ url: path });
    return;
  }

  uni.redirectTo({ url: normalized });
}

export function relaunchPage(url: string) {
  const normalized = normalizeUrl(url);
  const [path, query = ""] = normalized.split("?");

  if (tabPages.has(path)) {
    if (query) {
      uni.setStorageSync(`tab_query:${path}`, query);
    }
    uni.switchTab({ url: path });
    return;
  }

  uni.reLaunch({ url: normalized });
}

export function consumeTabQuery(path: string) {
  const normalized = normalizeUrl(path);
  const key = `tab_query:${normalized}`;
  const query = uni.getStorageSync(key);
  if (!query) {
    return {};
  }
  uni.removeStorageSync(key);
  return parseQuery(String(query));
}
