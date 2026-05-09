<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">账号恢复</text>
      <text class="title">通过邮箱重设密码</text>
      <text class="copy">输入账号邮箱后会生成重设 token。本地开发环境会直接显示，生产环境可接入邮件服务发送。</text>
    </view>

    <view class="card stack">
      <view class="field">
        <text class="label">账号邮箱</text>
        <input v-model="email" placeholder="请输入用户邮箱或咨询师工作邮箱" />
      </view>
      <button :disabled="requesting || !email" @click="requestReset">{{ requesting ? "发送中..." : "获取重设 token" }}</button>
      <view v-if="resetToken" class="field">
        <text class="label">重设 token</text>
        <input v-model="resetToken" />
      </view>
      <view class="field">
        <text class="label">新密码</text>
        <input v-model="password" password placeholder="至少 8 位" />
      </view>
      <text v-if="message" class="muted">{{ message }}</text>
      <text v-if="error" class="error">{{ error }}</text>
      <button class="button-soft" :disabled="submitting || !resetToken || !password" @click="confirmReset">
        {{ submitting ? "重设中..." : "确认重设" }}
      </button>
      <button @click="goLogin">返回登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { confirmPasswordReset, requestPasswordReset } from "../../api/client";
import { relaunchPage } from "../../utils/navigation";

const email = ref("");
const resetToken = ref("");
const password = ref("");
const requesting = ref(false);
const submitting = ref(false);
const message = ref("");
const error = ref("");

async function requestReset() {
  error.value = "";
  message.value = "";
  requesting.value = true;
  try {
    const result = await requestPasswordReset(email.value);
    message.value = result.message;
    resetToken.value = result.devToken ?? "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "请求失败";
  } finally {
    requesting.value = false;
  }
}

async function confirmReset() {
  error.value = "";
  message.value = "";
  submitting.value = true;
  try {
    const result = await confirmPasswordReset(resetToken.value, password.value);
    message.value = result.message;
    setTimeout(goLogin, 600);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "重设失败";
  } finally {
    submitting.value = false;
  }
}

function goLogin() {
  relaunchPage("/pages/login/index");
}
</script>
