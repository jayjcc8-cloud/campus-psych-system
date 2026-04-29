<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">咨询师端</text>
      <text class="title">登录后处理自己的支持请求</text>
      <text class="copy">咨询师端用于维护公开资料、开放时段和查看匿名请求。</text>
    </view>

    <view class="card stack">
      <view class="field">
        <text class="label">账号</text>
        <input v-model="username" placeholder="请输入咨询师账号" />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input v-model="password" password placeholder="请输入密码" />
      </view>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="submit">{{ loading ? "登录中..." : "登录" }}</button>
      <text class="muted">测试账号：zhou-laoshi / Counselor@123456</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { counselorLogin, setCounselorToken } from "../../api/client";

const username = ref("zhou-laoshi");
const password = ref("Counselor@123456");
const loading = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const result = await counselorLogin(username.value, password.value);
    setCounselorToken(result.token);
    uni.redirectTo({ url: "/pages/counselor-workspace/index" });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败";
  } finally {
    loading.value = false;
  }
}
</script>
