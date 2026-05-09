<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login, setToken } from "../api/client";

const router = useRouter();
const email = ref("center-admin@local.test");
const password = ref("Admin@123456");
const loading = ref(false);
const error = ref("");

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const result = await login(email.value, password.value);
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
      <p class="muted">用于查看预约记录、测评趋势、时段配置和审计记录。</p>
      <label>
        工作邮箱
        <input v-model="email" />
      </label>
      <label>
        密码
        <input v-model="password" type="password" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="loading" @click="submit">{{ loading ? "登录中..." : "登录" }}</button>
      <p class="muted login-hint">仅授权人员使用。后台默认不展开可选联系方式，避免不必要的信息暴露。</p>
    </section>
  </main>
</template>
