<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">创建账号</text>
      <text class="title">用邮箱开始，更容易记住</text>
      <text class="copy">邮箱仅用于登录和账号管理。你仍然可以使用昵称或代称，不需要填写真实身份。</text>
    </view>

    <view v-if="!created" class="card stack">
      <view class="field">
        <text class="label">邮箱</text>
        <input v-model="form.email" placeholder="用于登录，例如 name@example.com" />
      </view>
      <view class="field">
        <text class="label">设置密码</text>
        <input v-model="form.password" password placeholder="至少 8 位" />
      </view>
      <view class="field">
        <text class="label">希望被如何称呼</text>
        <input v-model="form.preferredName" placeholder="可选，昵称、代号或你愿意被称呼的方式" />
      </view>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="submit">{{ loading ? "创建中..." : "创建并登录" }}</button>
    </view>

    <view v-else class="card stack">
      <text class="label-text">账号已创建</text>
      <view class="safe-box">
        <text class="muted">登录邮箱</text>
        <text class="secret">{{ created.emailMasked }}</text>
      </view>
      <text class="muted">继续提交预约或测评前，需要先完成邮箱验证。本地开发环境会直接显示验证 token。</text>
      <view v-if="verificationToken" class="field">
        <text class="label">开发验证 token</text>
        <input v-model="verificationToken" />
      </view>
      <text v-if="verifyMessage" class="muted">{{ verifyMessage }}</text>
      <text v-if="verifyError" class="error">{{ verifyError }}</text>
      <button :disabled="verifying || !verificationToken" @click="verifyEmail">{{ verifying ? "验证中..." : "验证邮箱并重新登录" }}</button>
      <button class="button-light" @click="enterHome">先进入首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { PrivacyUserProfile } from "@teacher-support/shared";
import { clearCounselorToken, clearUserToken, confirmEmailVerification, registerPrivacyUser, setUserToken } from "../../api/client";
import { relaunchPage } from "../../utils/navigation";

const form = reactive({ email: "", preferredName: "", password: "" });
const loading = ref(false);
const error = ref("");
const created = ref<PrivacyUserProfile | null>(null);
const verificationToken = ref("");
const verifying = ref(false);
const verifyMessage = ref("");
const verifyError = ref("");

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const result = await registerPrivacyUser({
      email: form.email,
      preferredName: form.preferredName,
      password: form.password
    });
    clearCounselorToken();
    setUserToken(result.token);
    created.value = result.user;
    verificationToken.value = result.devVerificationToken ?? "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "创建失败";
  } finally {
    loading.value = false;
  }
}

async function verifyEmail() {
  verifyError.value = "";
  verifyMessage.value = "";
  verifying.value = true;
  try {
    const result = await confirmEmailVerification(verificationToken.value);
    verifyMessage.value = result.message;
    clearUserToken();
    setTimeout(() => {
      relaunchPage("/pages/login/index");
    }, 600);
  } catch (err) {
    verifyError.value = err instanceof Error ? err.message : "验证失败";
  } finally {
    verifying.value = false;
  }
}

function enterHome() {
  relaunchPage("/pages/index/index");
}
</script>

<style scoped>
.safe-box {
  border-radius: 28rpx;
  background: #f6f8ff;
  padding: 24rpx;
}

.secret {
  display: block;
  margin-top: 8rpx;
  color: #18233f;
  font-size: 34rpx;
  font-weight: 850;
  letter-spacing: 1rpx;
}
</style>
