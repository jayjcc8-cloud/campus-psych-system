<template>
  <view class="page">
    <view class="login-hero">
      <text class="eyebrow">心理支持</text>
      <text class="title">欢迎回来</text>
      <text class="copy">使用隐私 ID、账号或工作邮箱登录。系统会自动进入适合你的界面。</text>
    </view>

    <view class="card stack login-panel">
      <view class="field">
        <text class="label">账号</text>
        <input v-model="identifier" placeholder="隐私 ID / 工作邮箱 / 账号" />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input v-model="password" password placeholder="请输入密码" />
      </view>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="submit">{{ loading ? "登录中..." : "登录" }}</button>
      <button class="button-light" @click="go('/pages/account-recovery/index')">忘记密码</button>
    </view>

    <view class="anonymous-card interactive" @click="continueAnonymous">
      <view>
        <text class="anonymous-title">先继续浏览</text>
        <text class="anonymous-copy">可以查看首页、咨询师资料、隐私说明和紧急支持资源。</text>
      </view>
      <text class="anonymous-arrow">→</text>
    </view>

    <view class="entry-grid">
      <button class="button-soft" @click="go('/pages/user-register/index')">创建隐私账号</button>
      <button class="button-light" @click="go('/pages/counselor-register/index')">咨询师入驻申请</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { clearCounselorToken, clearUserToken, setCounselorToken, setUserToken, unifiedLogin } from "../../api/client";
import { openPage, relaunchPage, replacePage } from "../../utils/navigation";

const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const redirect = decodeURIComponent(current?.options?.redirect ?? "");
const identifier = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

function go(url: string) {
  openPage(url);
}

function continueAnonymous() {
  clearUserToken();
  clearCounselorToken();
  replacePage("/pages/index/index");
}

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const result = await unifiedLogin(identifier.value, password.value);
    if (result.role === "counselor") {
      clearUserToken();
      setCounselorToken(result.token);
      relaunchPage("/pages/counselor-workspace/index");
      return;
    }

    clearCounselorToken();
    setUserToken(result.token);
    relaunchPage(redirect || "/pages/index/index");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-hero {
  padding: 52rpx 16rpx 20rpx;
}

.login-panel {
  margin-top: 8rpx;
}

.anonymous-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24rpx 0;
  border-radius: 34rpx;
  background: linear-gradient(135deg, #eef6ff, #effcf7);
  box-shadow: 0 20rpx 54rpx rgba(28, 38, 70, 0.06);
  padding: 30rpx;
}

.anonymous-title,
.anonymous-copy {
  display: block;
}

.anonymous-title {
  color: #18233f;
  font-size: 31rpx;
  font-weight: 850;
}

.anonymous-copy {
  margin-top: 8rpx;
  color: #6b7b8d;
  font-size: 24rpx;
  line-height: 1.5;
}

.anonymous-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 22rpx;
  background: #ffffff;
  color: #6677ff;
  font-size: 34rpx;
  font-weight: 850;
}

.entry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}
</style>
