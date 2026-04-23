const anonymousSessionKey = "anonymous_session_id";

export function getAnonymousSessionId() {
  const stored = uni.getStorageSync(anonymousSessionKey);
  if (typeof stored === "string" && stored.length >= 12) {
    return stored;
  }

  const next = `anon_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  uni.setStorageSync(anonymousSessionKey, next);
  return next;
}
