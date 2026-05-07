<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">我的</text>
      <text class="title">{{ userProfile ? `${userProfile.preferredName}，欢迎回来` : "未登录" }}</text>
      <text class="copy">{{ userProfile ? "账号与隐私设置集中在这里。" : "登录后可以管理自己的预约回执和账号信息。" }}</text>
    </view>

    <view class="stack">
      <view class="profile-panel">
        <view class="avatar">{{ userProfile?.preferredName?.slice(0, 1) || "你" }}</view>
        <text class="profile-name">{{ userProfile?.preferredName || "匿名浏览" }}</text>
        <text class="muted">{{ userProfile ? userProfile.privacyId : "可以先浏览，需要提交预约时再登录" }}</text>
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
            <text class="label-text">账号恢复</text>
            <text class="muted">{{ userProfile ? "使用恢复短语重设密码" : "忘记密码时找回隐私账号" }}</text>
          </view>
          <text class="chevron">›</text>
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
import { ApiError, clearCounselorToken, clearUserToken, getPrivacyUserMe, getUserToken } from "../../api/client";
import { openPage } from "../../utils/navigation";

const userProfile = ref<PrivacyUserProfile | null>(null);

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
        clearUserToken();
        clearCounselorToken();
        userProfile.value = null;
        uni.reLaunch({ url: "/pages/login/index" });
      }
    }
  });
}

onShow(refreshUser);
</script>
