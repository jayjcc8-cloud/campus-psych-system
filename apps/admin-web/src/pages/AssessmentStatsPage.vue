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
const riskRows = computed(() => {
  if (!stats.value) return [];
  return (["low", "medium", "high"] as const).map((level) => ({
    level,
    label: assessmentRiskLabels[level],
    count: stats.value!.riskDistribution[level],
    percent: stats.value!.totalCount ? Math.round((stats.value!.riskDistribution[level] / stats.value!.totalCount) * 100) : 0
  }));
});

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
      <article class="metric-card">
        <p class="eyebrow">量表版本</p>
        <h3>{{ stats.scaleVersion || "open_source_v1" }}</h3>
        <p class="muted">{{ stats.sourceProfile }}</p>
      </article>
    </div>

    <section class="section-block">
      <h3>量化分布</h3>
      <div v-if="stats" class="dashboard-grid">
        <article class="detail-panel compact-panel">
          <p class="eyebrow">风险分布</p>
          <div class="risk-bars">
            <div v-for="item in riskRows" :key="item.level" class="bar-line">
              <span>{{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :class="`risk-${item.level}`" :style="{ width: `${item.percent}%` }" />
              </div>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </article>
        <article class="detail-panel compact-panel">
          <p class="eyebrow">量表平均分</p>
          <div class="score-bars">
            <div v-for="score in stats.averageScores || []" :key="score.scale" class="bar-line">
              <span>{{ score.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${score.normalizedScore}%` }" />
              </div>
              <strong>{{ score.rawScore }}/{{ score.maxScore }}</strong>
            </div>
            <p v-if="!stats.averageScores?.length" class="empty-card">暂无均值数据。</p>
          </div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <h3>近期测评</h3>
      <div class="audit-list">
        <article v-for="item in stats?.recent || []" :key="item.id" class="audit-card">
          <div>
            <p class="eyebrow">{{ item.preferredName || "匿名用户" }}</p>
            <h3>{{ assessmentRiskLabels[item.riskLevel] }}</h3>
            <p class="muted">WHO-5 {{ item.who5Score }} · PHQ-9 {{ item.phq9Score }} · GAD-7 {{ item.gad7Score }}</p>
            <div v-if="item.scoreSummary?.length" class="score-chip-row">
              <span v-for="score in item.scoreSummary" :key="score.scale" class="pill">
                {{ score.label }}：{{ score.rawScore }}/{{ score.maxScore }} · {{ score.bandLabel }}
              </span>
            </div>
            <p class="muted">来源：{{ item.sourceProfile || "WHO-5 + PHQ-9 + GAD-7 public screening v1" }}</p>
            <p v-if="item.safetyFlag" class="error">含安全提醒信号</p>
          </div>
          <span class="pill">{{ new Date(item.createdAt).toLocaleString() }}</span>
        </article>
        <p v-if="stats && stats.recent.length === 0" class="empty-card">暂无测评记录。</p>
      </div>
    </section>
  </AdminShell>
</template>
