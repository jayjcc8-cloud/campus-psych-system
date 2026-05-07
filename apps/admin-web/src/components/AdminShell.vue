<script setup lang="ts">
import { useRouter } from "vue-router";
import { getToken } from "../api/client";

const router = useRouter();

function logout() {
  localStorage.removeItem("teacher_support_admin_token");
  router.replace("/login");
}
</script>

<template>
  <main class="admin-layout">
    <aside class="nav-panel">
      <p class="eyebrow">支持管理后台</p>
      <h1>匿名支持后台</h1>
      <p class="muted">以尊重和克制的方式承接用户支持请求。</p>

      <nav class="nav-list">
        <RouterLink to="/">请求池</RouterLink>
        <RouterLink to="/assessment-stats">测评概览</RouterLink>
        <RouterLink to="/slots">时段配置</RouterLink>
        <RouterLink to="/audit-logs">审计日志</RouterLink>
      </nav>

      <button v-if="getToken()" class="secondary full" @click="logout">退出登录</button>
    </aside>

    <section class="page-panel">
      <slot />
    </section>
  </main>
</template>
