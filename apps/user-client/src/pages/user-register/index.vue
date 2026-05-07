<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">创建隐私账号</text>
      <text class="title">少填一点，也更安心一点</text>
      <text class="copy">系统会生成隐私 ID。它不是实名身份，只用于登录和管理自己的记录。</text>
    </view>

    <view v-if="!created" class="card stack">
      <view class="field">
        <text class="label">希望被如何称呼</text>
        <input v-model="form.preferredName" placeholder="昵称、代号或你愿意被称呼的方式" />
      </view>
      <view class="field">
        <text class="label">设置密码</text>
        <input v-model="form.password" password placeholder="至少 8 位" />
      </view>
      <view class="field">
        <text class="label">恢复邮箱</text>
        <input v-model="form.recoveryEmail" placeholder="可选，用于后续找回" />
      </view>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="submit">{{ loading ? "创建中..." : "创建并登录" }}</button>
    </view>

    <view v-else class="card stack">
      <text class="label-text">账号已创建</text>
      <view class="safe-box">
        <text class="muted">隐私 ID</text>
        <text class="secret">{{ created.privacyId }}</text>
      </view>
      <view class="safe-box">
        <text class="muted">恢复短语</text>
        <text class="secret">{{ recoveryPhrase }}</text>
      </view>
      <text class="muted">恢复短语只展示这一次。请保存到安全位置，换设备或忘记密码时会用到。</text>
      <button @click="copyRecovery">复制恢复信息</button>
      <button class="button-light" @click="enterHome">进入首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { PrivacyUserProfile } from "@teacher-support/shared";
import { clearCounselorToken, registerPrivacyUser, setUserToken } from "../../api/client";
import { relaunchPage } from "../../utils/navigation";

const form = reactive({ preferredName: "", password: "", recoveryEmail: "" });
const loading = ref(false);
const error = ref("");
const created = ref<PrivacyUserProfile | null>(null);
const recoveryPhrase = ref("");

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const result = await registerPrivacyUser({
      preferredName: form.preferredName,
      password: form.password,
      recoveryEmail: form.recoveryEmail
    });
    clearCounselorToken();
    setUserToken(result.token);
    created.value = result.user;
    recoveryPhrase.value = result.recoveryPhrase;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "创建失败";
  } finally {
    loading.value = false;
  }
}

function copyRecovery() {
  if (!created.value) return;
  uni.setClipboardData({
    data: `隐私 ID：${created.value.privacyId}\n恢复短语：${recoveryPhrase.value}`,
    success: () => uni.showToast({ title: "已复制", icon: "success" })
  });
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
