<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { assessmentRiskLabels, type AssessmentStats } from "@teacher-support/shared";
import { listAssessmentStats } from "../api/client";
import AdminShell from "../components/AdminShell.vue";

const stats = ref<AssessmentStats | null>(null);
const loading = ref(false);
const error = ref("");

const lowRiskCount = computed(() =>
  Math.max((stats.value?.totalCount ?? 0) - (stats.value?.highRiskCount ?? 0) - (stats.value?.mediumRiskCount ?? 0), 0)
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    stats.value = await listAssessmentStats();
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
        <p class="eyebrow">测评概览</p>
        <h2>匿名筛查趋势</h2>
      </div>
      <button @click="load">刷新</button>
    </div>

    <p v-if="loading" class="muted">正在同步测评数据...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="stats" class="metrics-grid">
      <article class="metric-card">
        <p class="eyebrow">累计测评</p>
        <h3>{{ stats.totalCount }}</h3>
      </article>
      <article class="metric-card metric-warn">
        <p class="eyebrow">中风险提示</p>
        <h3>{{ stats.mediumRiskCount }}</h3>
      </article>
      <article class="metric-card metric-danger">
        <p class="eyebrow">高风险提示</p>
        <h3>{{ stats.highRiskCount }}</h3>
      </article>
      <article class="metric-card">
        <p class="eyebrow">低风险提示</p>
        <h3>{{ lowRiskCount }}</h3>
      </article>
    </div>

    <section class="section-block">
      <h3>近期测评</h3>
      <div class="audit-list">
        <article v-for="item in stats?.recent || []" :key="item.id" class="audit-card">
          <div>
            <p class="eyebrow">{{ item.preferredName || "匿名用户" }}</p>
            <h3>{{ assessmentRiskLabels[item.riskLevel] }}</h3>
            <p class="muted">WHO-5 {{ item.who5Score }} · PHQ-9 {{ item.phq9Score }} · GAD-7 {{ item.gad7Score }}</p>
            <p v-if="item.safetyFlag" class="error">含安全提醒信号</p>
          </div>
          <span class="pill">{{ new Date(item.createdAt).toLocaleString() }}</span>
        </article>
        <p v-if="stats && stats.recent.length === 0" class="empty-card">暂无测评记录。</p>
      </div>
    </section>
  </AdminShell>
</template>
