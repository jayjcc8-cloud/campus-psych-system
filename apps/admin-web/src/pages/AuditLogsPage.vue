<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { AuditLogEntry } from "@teacher-support/shared";
import { listAuditLogs } from "../api/client";
import AdminShell from "../components/AdminShell.vue";

const logs = ref<AuditLogEntry[]>([]);
const loading = ref(false);
const error = ref("");
const keyword = ref("");

const visibleLogs = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  if (!value) {
    return logs.value;
  }

  return logs.value.filter((log) =>
    [log.adminDisplayName, log.action, log.targetType, log.targetId, log.detail]
      .filter(Boolean)
      .some((item) => item!.toLowerCase().includes(value))
  );
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    logs.value = await listAuditLogs();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <AdminShell>
    <div class="page-heading">
      <div>
        <p class="eyebrow">审计日志</p>
        <h2>后台操作记录</h2>
      </div>
      <button @click="load">刷新</button>
    </div>

    <div class="toolbar">
      <input v-model="keyword" placeholder="搜索操作、对象或人员" />
    </div>

    <p v-if="loading" class="muted">正在加载审计日志...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="audit-list">
      <article v-for="log in visibleLogs" :key="log.id" class="audit-card">
        <div>
          <p class="eyebrow">{{ log.action }}</p>
          <h3>{{ log.adminDisplayName || "系统" }}</h3>
          <p class="muted">{{ log.targetType }} · {{ log.targetId }}</p>
          <p v-if="log.detail" class="muted">详情：{{ log.detail }}</p>
        </div>
        <span class="pill">{{ new Date(log.createdAt).toLocaleString() }}</span>
      </article>

      <p v-if="!loading && visibleLogs.length === 0" class="empty-card">暂无审计记录。</p>
    </div>
  </AdminShell>
</template>
