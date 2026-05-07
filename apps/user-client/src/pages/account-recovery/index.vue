<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">账号恢复</text>
      <text class="title">用恢复短语重设密码</text>
      <text class="copy">恢复短语用于确认这是你的隐私账号。平台不会保存明文短语。</text>
    </view>

    <view class="card stack">
      <view class="field">
        <text class="label">隐私 ID</text>
        <input v-model="form.privacyId" placeholder="例如 U-8K4M-29Q7" />
      </view>
      <view class="field">
        <text class="label">恢复短语</text>
        <input v-model="form.recoveryPhrase" placeholder="输入注册时保存的恢复短语" />
      </view>
      <view class="field">
        <text class="label">新密码</text>
        <input v-model="form.password" password placeholder="至少 8 位" />
      </view>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="submit">{{ loading ? "处理中..." : "重设密码" }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { clearCounselorToken, clearUserToken, recoverPrivacyUser } from "../../api/client";
import { relaunchPage } from "../../utils/navigation";

const form = reactive({ privacyId: "", recoveryPhrase: "", password: "" });
const loading = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await recoverPrivacyUser(form);
    clearCounselorToken();
    clearUserToken();
    uni.showToast({ title: "请重新登录", icon: "success" });
    setTimeout(() => {
      relaunchPage("/pages/login/index");
    }, 500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "恢复失败";
  } finally {
    loading.value = false;
  }
}
</script>
