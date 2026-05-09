<template>
  <slot />
  <!-- #ifdef MP-WEIXIN -->
  <view v-if="showSplash" class="launch-splash">
    <view class="launch-orb">
      <text class="launch-dot launch-dot-left"></text>
      <text class="launch-dot launch-dot-right"></text>
    </view>
    <view class="launch-copy">
      <wd-tag type="primary" round plain>Privacy protocols active</wd-tag>
      <text class="launch-title">把想说的话，放在更安全的地方</text>
      <text class="launch-text">预约和测评都以隐私友好为前提。你可以慢慢来，也可以只留下自己愿意表达的部分。</text>
    </view>
    <button class="launch-button" @click="dismissSplash">进入小程序</button>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app";
import { ref } from "vue";

const showSplash = ref(false);
let splashTimer: ReturnType<typeof setTimeout> | undefined;

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function dismissSplash() {
  if (splashTimer) {
    clearTimeout(splashTimer);
  }
  uni.setStorageSync("psych_center_splash_seen_date", todayKey());
  showSplash.value = false;
}

onLaunch(() => {
  // #ifdef MP-WEIXIN
  const key = todayKey();
  showSplash.value = uni.getStorageSync("psych_center_splash_seen_date") !== key;
  if (showSplash.value) {
    splashTimer = setTimeout(dismissSplash, 1800);
  }
  // #endif
});
</script>

<style>
.launch-splash {
  position: fixed;
  z-index: 9999;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background:
    radial-gradient(circle at 70% 18%, rgba(37, 99, 235, 0.16), transparent 32%),
    radial-gradient(circle at 18% 78%, rgba(123, 226, 202, 0.22), transparent 28%),
    #f2f2f7;
  padding: 72rpx 48rpx calc(72rpx + env(safe-area-inset-bottom));
  text-align: center;
}

.launch-orb {
  position: relative;
  width: 210rpx;
  height: 210rpx;
  border-radius: 82rpx;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 218, 210, 0.92), transparent 26%),
    radial-gradient(circle at 64% 66%, rgba(37, 99, 235, 0.78), transparent 45%),
    rgba(157, 240, 220, 0.5);
  box-shadow: 0 36rpx 90rpx rgba(37, 99, 235, 0.14);
}

.launch-dot {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
}

.launch-dot-left {
  left: -18rpx;
  bottom: 54rpx;
  background: rgba(255, 179, 198, 0.76);
}

.launch-dot-right {
  right: -18rpx;
  bottom: 66rpx;
  background: rgba(37, 99, 235, 0.62);
}

.launch-copy {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 58rpx;
}

.launch-eyebrow {
  border-radius: 999rpx;
  background: #eff6ff;
  color: #2563eb;
  padding: 10rpx 22rpx;
  font-size: 24rpx;
  font-weight: 800;
}

.launch-title {
  max-width: 610rpx;
  color: #101828;
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1.25;
}

.launch-text {
  max-width: 600rpx;
  color: #374151;
  font-size: 27rpx;
  line-height: 1.75;
}

.launch-button {
  width: 100%;
  max-width: 560rpx;
  margin-top: 64rpx;
  border-radius: 30rpx;
  background: #2563eb;
  color: #ffffff;
  font-size: 29rpx;
  font-weight: 850;
  box-shadow: 0 24rpx 62rpx rgba(37, 99, 235, 0.18);
}
</style>
