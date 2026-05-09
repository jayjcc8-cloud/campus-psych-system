<template>
  <!-- #ifdef H5 -->
  <view class="h5-login-page">
    <view class="h5-site-header">
      <view class="h5-brand" @click="go('/pages/index/index')">
        <text class="h5-brand-mark">心</text>
        <text>心理支持预约</text>
      </view>
      <view class="h5-nav">
        <button class="h5-link-button" @click="continueAnonymous">继续浏览</button>
        <button class="h5-link-button" @click="go('/pages/counselor-register/index')">咨询师入驻</button>
      </view>
    </view>

    <view class="h5-login-container">
      <view class="h5-login-copy">
        <text class="eyebrow">统一登录</text>
        <text class="h5-login-title">一个入口，自动进入适合你的工作区</text>
        <text class="h5-login-text">用户和咨询师都使用邮箱登录。系统根据账号类型自动分流，不需要在登录前选择身份。</text>
        <view class="h5-login-points">
          <text>用户账号：预约、测评、回执查看</text>
          <text>咨询师账号：预约处理、排期、公开资料</text>
          <text>后台管理：请使用独立后台入口</text>
        </view>
      </view>

      <view class="h5-login-card h5-shell-card">
        <text class="card-title">登录</text>
        <text class="muted">输入邮箱和密码。</text>
        <view class="field">
          <text class="label">邮箱</text>
          <input v-model="identifier" placeholder="用户邮箱 / 咨询师工作邮箱" />
        </view>
        <view class="field">
          <text class="label">密码</text>
          <input v-model="password" password placeholder="请输入密码" />
        </view>
        <text v-if="error" class="error">{{ error }}</text>
        <button :disabled="loading" @click="submit">{{ loading ? "登录中..." : "登录" }}</button>
        <view class="h5-login-actions">
          <button class="button-light" @click="go('/pages/user-register/index')">创建邮箱账号</button>
          <button class="button-soft" @click="go('/pages/account-recovery/index')">忘记密码</button>
        </view>
      </view>
    </view>
  </view>
  <!-- #endif -->

  <!-- #ifdef MP-WEIXIN -->
  <view class="page">
    <view class="login-hero">
      <text class="eyebrow">心理支持</text>
      <text class="title">欢迎回来</text>
      <text class="copy">使用邮箱和密码登录。系统会自动进入适合你的界面。</text>
    </view>

    <view class="card stack login-panel">
      <view class="field">
        <text class="label">邮箱</text>
        <input v-model="identifier" placeholder="用户邮箱 / 咨询师工作邮箱" />
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
      <button class="button-soft" @click="go('/pages/user-register/index')">创建邮箱账号</button>
      <button class="button-light" @click="go('/pages/counselor-register/index')">咨询师入驻申请</button>
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { clearCounselorToken, clearUserToken, setCounselorToken, setUserToken, unifiedLogin } from "../../api/client";
import { openPage, relaunchPage, replacePage } from "../../utils/navigation";

const redirect = ref("");
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
    relaunchPage(redirect.value || "/pages/index/index");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败";
  } finally {
    loading.value = false;
  }
}

onLoad((options = {}) => {
  redirect.value = typeof options.redirect === "string" ? decodeURIComponent(options.redirect) : "";
});
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
  color: #2563eb;
  font-size: 34rpx;
  font-weight: 850;
}

.entry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

/* #ifdef H5 */
.h5-login-page {
  min-height: 100vh;
  padding-bottom: 72px;
}

.h5-login-container {
  display: grid;
  align-items: center;
  width: min(1040px, calc(100vw - 48px));
  min-height: calc(100vh - 112px);
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 56px;
  margin: 0 auto;
}

.h5-login-copy {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.h5-login-title {
  display: block;
  color: #101828;
  font-size: 52px;
  font-weight: 900;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.h5-login-text {
  display: block;
  color: #667085;
  font-size: 17px;
  line-height: 1.8;
}

.h5-login-points {
  display: grid;
  gap: 12px;
  color: #344054;
  font-size: 15px;
}

.h5-login-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 30px;
}

.h5-login-card button {
  min-height: 48px;
  border-radius: 16px;
  padding: 12px 18px;
  font-size: 15px;
}

.h5-login-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 860px) {
  .h5-login-container {
    grid-template-columns: 1fr;
    width: min(100vw - 28px, 560px);
    gap: 28px;
    padding-top: 20px;
  }

  .h5-login-title {
    font-size: 38px;
  }
}
/* #endif */
</style>
