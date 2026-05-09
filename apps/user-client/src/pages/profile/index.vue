<template>
  <view class="page">
    <!-- #ifdef H5 -->
    <view class="h5-flow-header">
      <view>
        <text class="h5-flow-title">账号与设置</text>
        <text class="h5-flow-subtitle">统一管理登录状态、隐私说明和安全入口</text>
      </view>
      <button class="h5-link-button" @click="go('/pages/index/index')">返回首页</button>
    </view>
    <!-- #endif -->

    <view class="hero hero-compact">
      <text class="eyebrow">我的</text>
      <text class="title">{{ userProfile ? `${userProfile.preferredName}，欢迎回来` : "未登录" }}</text>
      <text class="copy">{{ userProfile ? "账号与隐私设置集中在这里。" : "登录后可以管理自己的预约回执和账号信息。" }}</text>
    </view>

    <view class="stack">
      <view class="profile-panel">
        <view class="avatar">{{ userProfile?.preferredName?.slice(0, 1) || "你" }}</view>
        <text class="profile-name">{{ userProfile?.preferredName || "匿名浏览" }}</text>
        <text class="muted">{{ userProfile ? userProfile.emailMasked : "可以先浏览，需要提交预约时再登录" }}</text>
      </view>

      <view class="settings-list">
        <view class="settings-cell interactive" @click="go('/pages/requests/index')">
          <view>
            <text class="label-text">我的预约</text>
            <text class="muted">查看预约回执和处理状态</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view class="settings-cell interactive" @click="go('/pages/assessment/index')">
          <view>
            <text class="label-text">心理测评</text>
            <text class="muted">作为状态参考，结果仅用于自我了解</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view class="settings-cell interactive" @click="go('/pages/account-recovery/index')">
          <view>
            <text class="label-text">账号安全</text>
            <text class="muted">{{ userProfile ? "邮箱账号与密码重置说明" : "忘记密码时联系支持中心" }}</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view v-if="userProfile && !userProfile.emailVerified" class="settings-cell verify-cell">
          <view>
            <text class="label-text">邮箱验证</text>
            <text class="muted">完成验证后可提交预约和测评</text>
            <view v-if="verificationToken" class="field inline-field">
              <input v-model="verificationToken" placeholder="输入验证 token" />
            </view>
            <text v-if="verifyMessage" class="muted">{{ verifyMessage }}</text>
            <text v-if="verifyError" class="error">{{ verifyError }}</text>
          </view>
          <view class="verify-actions">
            <button class="button-light compact-button" @click="sendVerification">获取</button>
            <button class="button-soft compact-button" :disabled="!verificationToken" @click="confirmVerification">验证</button>
          </view>
        </view>
        <view class="settings-cell interactive" @click="go('/pages/privacy/index')">
          <view>
            <text class="label-text">隐私说明</text>
            <text class="muted">了解数据边界和匿名机制</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view class="settings-cell interactive" @click="go('/pages/emergency/index')">
          <view>
            <text class="label-text">紧急支持</text>
            <text class="muted">需要立即帮助时查看</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <!-- #ifdef MP-WEIXIN -->
        <view class="settings-cell interactive" @click="previewSplash">
          <view>
            <text class="label-text">预览启动页</text>
            <text class="muted">清除今日展示记录后重新打开启动宣传页</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <!-- #endif -->
        <view v-if="userProfile" class="settings-cell interactive danger-cell" @click="confirmLogout">
          <view>
            <text class="label-text">退出登录</text>
            <text class="muted">本机预约回执不会被删除</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view v-else class="settings-cell interactive" @click="go('/pages/login/index')">
          <view>
            <text class="label-text">登录 / 注册</text>
            <text class="muted">进入统一登录页</text>
          </view>
          <text class="chevron">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import type { PrivacyUserProfile } from "@teacher-support/shared";
import {
  ApiError,
  clearCounselorToken,
  clearUserToken,
  confirmEmailVerification,
  getPrivacyUserMe,
  getUserToken,
  logoutCurrentToken,
  requestEmailVerification
} from "../../api/client";
import { openPage } from "../../utils/navigation";

const userProfile = ref<PrivacyUserProfile | null>(null);
const verificationToken = ref("");
const verifyMessage = ref("");
const verifyError = ref("");

function go(url: string) {
  openPage(url);
}

async function refreshUser() {
  if (!getUserToken()) {
    userProfile.value = null;
    return;
  }

  try {
    userProfile.value = await getPrivacyUserMe();
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      clearUserToken();
      userProfile.value = null;
    }
  }
}

function confirmLogout() {
  uni.showModal({
    title: "退出登录",
    content: "退出后会回到统一登录页，本机预约回执不会被删除。",
    confirmText: "退出",
    cancelText: "取消",
    success(result) {
      if (result.confirm) {
        void logoutCurrentToken().finally(() => {
          clearUserToken();
          clearCounselorToken();
          userProfile.value = null;
          uni.reLaunch({ url: "/pages/login/index" });
        });
      }
    }
  });
}

async function sendVerification() {
  verifyError.value = "";
  verifyMessage.value = "";
  try {
    const result = await requestEmailVerification(userProfile.value?.email ?? "");
    verifyMessage.value = result.message;
    verificationToken.value = result.devToken ?? verificationToken.value;
  } catch (err) {
    verifyError.value = err instanceof Error ? err.message : "发送失败";
  }
}

async function confirmVerification() {
  verifyError.value = "";
  verifyMessage.value = "";
  try {
    const result = await confirmEmailVerification(verificationToken.value);
    verifyMessage.value = result.message;
    clearUserToken();
    uni.reLaunch({ url: "/pages/login/index" });
  } catch (err) {
    verifyError.value = err instanceof Error ? err.message : "验证失败";
  }
}

function previewSplash() {
  uni.removeStorageSync("psych_center_splash_seen_date");
  uni.showToast({ title: "已重置启动页", icon: "success" });
  setTimeout(() => {
    uni.reLaunch({ url: "/pages/index/index" });
  }, 500);
}

function syncProfileChrome() {
  // #ifdef H5
  uni.hideTabBar();
  // #endif

  // #ifdef MP-WEIXIN
  uni.showTabBar();
  // #endif
}

function handleShow() {
  syncProfileChrome();
  void refreshUser();
}

onShow(handleShow);
</script>

<style scoped>
.verify-cell {
  align-items: flex-start;
}

.verify-actions {
  display: flex;
  gap: 12rpx;
}

.inline-field {
  margin-top: 12rpx;
}
</style>
