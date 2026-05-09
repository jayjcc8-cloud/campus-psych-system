<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { assessmentRiskLabels, requestStatusLabels, type AdminDashboardSummary } from "@teacher-support/shared";
import { getDashboard } from "../api/client";
import AdminShell from "../components/AdminShell.vue";

const dashboard = ref<AdminDashboardSummary | null>(null);
const loading = ref(false);
const error = ref("");

const maxTrend = computed(() => Math.max(...(dashboard.value?.requestTrend.map((item) => item.count) ?? [1]), 1));
const riskRows = computed(() => {
  const distribution = dashboard.value?.riskDistribution;
  const total = distribution ? distribution.low + distribution.medium + distribution.high : 0;
  return (["low", "medium", "high"] as const).map((level) => ({
    level,
    label: assessmentRiskLabels[level],
    count: distribution?.[level] ?? 0,
    percent: total ? Math.round(((distribution?.[level] ?? 0) / total) * 100) : 0
  }));
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    dashboard.value = await getDashboard();
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
        <p class="eyebrow">数据看板</p>
        <h2>服务中心概览</h2>
        <p class="muted">聚合预约、测评风险、咨询师审核和时段利用情况。</p>
      </div>
      <button @click="load">刷新</button>
    </div>

    <p v-if="loading" class="muted">正在同步看板数据...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="dashboard">
      <div class="metrics-grid">
        <article class="metric-card">
          <p class="eyebrow">总预约</p>
          <h3>{{ dashboard.requestTotal }}</h3>
        </article>
        <article class="metric-card metric-warn">
          <p class="eyebrow">待确认</p>
          <h3>{{ dashboard.pendingCount }}</h3>
        </article>
        <article class="metric-card metric-danger">
          <p class="eyebrow">高风险提示</p>
          <h3>{{ dashboard.highRiskCount }}</h3>
        </article>
        <article class="metric-card">
          <p class="eyebrow">咨询师待审</p>
          <h3>{{ dashboard.pendingCounselorReviewCount }}</h3>
        </article>
      </div>

      <section class="section-block dashboard-grid">
        <article class="detail-panel compact-panel">
          <p class="eyebrow">近 7 日预约趋势</p>
          <h3>新增预约</h3>
          <div class="trend-chart">
            <div v-for="item in dashboard.requestTrend" :key="item.date" class="trend-column">
              <span class="trend-bar" :style="{ height: `${Math.max(8, (item.count / maxTrend) * 100)}%` }" />
              <small>{{ item.date.slice(5) }}</small>
            </div>
          </div>
        </article>

        <article class="detail-panel compact-panel">
          <p class="eyebrow">测评风险分布</p>
          <h3>量化筛查概览</h3>
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
      </section>

      <section class="section-block dashboard-grid">
        <article class="detail-panel compact-panel">
          <p class="eyebrow">咨询师工作量</p>
          <h3>预约分布</h3>
          <div class="audit-list">
            <article v-for="item in dashboard.counselorWorkload" :key="item.counselorId" class="compact-list-card">
              <strong>{{ item.counselorName }}</strong>
              <span>{{ item.requestCount }} 个预约 / {{ item.pendingCount }} 个待确认</span>
            </article>
            <p v-if="dashboard.counselorWorkload.length === 0" class="empty-card">暂无咨询师预约数据。</p>
          </div>
        </article>

        <article class="detail-panel compact-panel">
          <p class="eyebrow">近期高风险</p>
          <h3>需要优先留意</h3>
          <div class="audit-list">
            <article v-for="item in dashboard.recentHighRisk" :key="item.id" class="compact-list-card">
              <strong>{{ item.preferredName || "用户" }}</strong>
              <span>{{ requestStatusLabels[item.status] }} · {{ new Date(item.createdAt).toLocaleString() }}</span>
            </article>
            <p v-if="dashboard.recentHighRisk.length === 0" class="empty-card">暂无高风险关联预约。</p>
          </div>
        </article>
      </section>

      <section class="section-block">
        <article class="detail-panel compact-panel">
          <p class="eyebrow">时段利用率</p>
          <h3>{{ dashboard.slotUtilizationPercent }}%</h3>
          <div class="bar-track wide-track">
            <div class="bar-fill" :style="{ width: `${dashboard.slotUtilizationPercent}%` }" />
          </div>
        </article>
      </section>
    </template>
  </AdminShell>
</template>
