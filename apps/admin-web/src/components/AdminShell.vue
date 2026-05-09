<script setup lang="ts">
import { useRouter } from "vue-router";
import { getToken, logout as logoutApi } from "../api/client";

const router = useRouter();

function logout() {
  void logoutApi().finally(() => {
    router.replace("/login");
  });
}
</script>

<template>
  <main class="admin-layout">
    <aside class="nav-panel">
      <p class="eyebrow">心理支持管理平台</p>
      <h1>后台管理</h1>
      <p class="muted">数据看板、审核、配置与审计。</p>

      <nav class="nav-list">
        <RouterLink to="/">数据看板</RouterLink>
        <RouterLink to="/requests">预约池</RouterLink>
        <RouterLink to="/counselor-reviews">咨询师审核</RouterLink>
        <RouterLink to="/assessment-stats">测评概览</RouterLink>
        <RouterLink to="/slots">时段配置</RouterLink>
        <RouterLink to="/audit-logs">审计日志</RouterLink>
      </nav>

      <section class="nav-note">
        <t-tag theme="primary" variant="light">Privacy protocols active</t-tag>
        <p>后台只做统计、审核和审计，日常资料与排期优先由咨询师端维护。</p>
      </section>

      <t-button v-if="getToken()" theme="default" variant="outline" block @click="logout">退出登录</t-button>
    </aside>

    <section class="page-panel">
      <slot />
    </section>
  </main>
</template>
