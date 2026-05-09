<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">账号与安全</text>
      <text class="title">管理当前登录状态</text>
      <text class="copy">账号操作统一放在这里，避免干扰日常预约处理。</text>
    </view>

    <view class="card stack-small">
      <view class="row-start">
        <view class="avatar avatar-small">{{ profile?.displayName?.slice(0, 1) || "咨" }}</view>
        <view>
          <text class="label-text">{{ profile?.displayName || "咨询师" }}</text>
          <text class="muted">{{ profile?.title || "心理支持" }}</text>
        </view>
      </view>
    </view>

    <view class="settings-list">
      <view class="settings-cell">
        <view>
          <text class="label-text">登录状态</text>
          <text class="muted">当前设备已登录咨询师账号</text>
        </view>
        <text class="pill pill-soft">已登录</text>
      </view>
      <view class="settings-cell interactive danger-cell" @click="confirmLogout">
        <view>
          <text class="label-text">退出登录</text>
          <text class="muted">退出后回到统一登录页</text>
        </view>
        <text class="chevron">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { CounselorProfile } from "@teacher-support/shared";
import { ApiError, clearCounselorToken, getCounselorMe, logoutCurrentToken } from "../../api/client";

const profile = ref<CounselorProfile | null>(null);

async function load() {
  try {
    profile.value = await getCounselorMe();
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      clearCounselorToken();
      uni.reLaunch({ url: "/pages/login/index" });
    }
  }
}

function confirmLogout() {
  uni.showModal({
    title: "退出登录",
    content: "退出后需要重新输入咨询师账号和密码。",
    confirmText: "退出",
    cancelText: "取消",
    success(result) {
      if (result.confirm) {
        void logoutCurrentToken().finally(() => {
          clearCounselorToken();
          uni.reLaunch({ url: "/pages/login/index" });
        });
      }
    }
  });
}

onMounted(load);
</script>
