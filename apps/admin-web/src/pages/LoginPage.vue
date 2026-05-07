<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login, setToken } from "../api/client";

const router = useRouter();
const username = ref("center-admin");
const password = ref("Admin@123456");
const loading = ref(false);
const error = ref("");

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const result = await login(username.value, password.value);
    setToken(result.token);
    await router.push("/");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <p class="eyebrow">支持管理后台</p>
      <h1>后台登录</h1>
      <p class="muted">用于查看匿名支持请求、维护开放时段和处理审计。</p>
      <label>
        账号
        <input v-model="username" />
      </label>
      <label>
        密码
        <input v-model="password" type="password" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="loading" @click="submit">{{ loading ? "登录中..." : "登录" }}</button>
    </section>
  </main>
</template>
