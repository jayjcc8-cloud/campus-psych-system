<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { CounselorReviewSummary } from "@teacher-support/shared";
import { listCounselorReviews, reviewCounselor, updateCounselorStatus } from "../api/client";
import AdminShell from "../components/AdminShell.vue";

const reviews = ref<CounselorReviewSummary[]>([]);
const loading = ref(false);
const error = ref("");
const activeStatus = ref("pending_review");
const reason = ref("");

const visibleReviews = computed(() =>
  activeStatus.value === "all" ? reviews.value : reviews.value.filter((item) => item.status === activeStatus.value)
);
const pendingCount = computed(() => reviews.value.filter((item) => item.status === "pending_review").length);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    reviews.value = await listCounselorReviews();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

async function approve(item: CounselorReviewSummary) {
  await reviewCounselor(item.id, "approve", reason.value);
  reason.value = "";
  await load();
}

async function reject(item: CounselorReviewSummary) {
  await reviewCounselor(item.id, "reject", reason.value || "资料未通过审核");
  reason.value = "";
  await load();
}

async function toggleStatus(item: CounselorReviewSummary) {
  await updateCounselorStatus(item.id, item.status === "approved" ? "suspended" : "approved");
  await load();
}

onMounted(load);
</script>

<template>
  <AdminShell>
    <div class="page-heading">
      <div>
        <p class="eyebrow">咨询师审核</p>
        <h2>入驻申请与账号状态</h2>
        <p class="muted">审核通过后，咨询师才能使用工作邮箱登录小程序端。</p>
      </div>
      <button @click="load">刷新</button>
    </div>

    <div class="metrics-grid request-metrics">
      <article class="metric-card metric-warn">
        <p class="eyebrow">待审核</p>
        <h3>{{ pendingCount }}</h3>
      </article>
      <article class="metric-card">
        <p class="eyebrow">全部申请</p>
        <h3>{{ reviews.length }}</h3>
      </article>
      <article class="metric-card">
        <p class="eyebrow">已启用</p>
        <h3>{{ reviews.filter((item) => item.status === "approved").length }}</h3>
      </article>
    </div>

    <div class="toolbar">
      <button :class="{ active: activeStatus === 'pending_review' }" @click="activeStatus = 'pending_review'">待审核</button>
      <button :class="{ active: activeStatus === 'approved' }" @click="activeStatus = 'approved'">已启用</button>
      <button :class="{ active: activeStatus === 'suspended' }" @click="activeStatus = 'suspended'">已停用/驳回</button>
      <button :class="{ active: activeStatus === 'all' }" @click="activeStatus = 'all'">全部</button>
    </div>

    <label>
      审核说明
      <input v-model="reason" placeholder="可选，记录通过或驳回原因" />
    </label>

    <p v-if="loading" class="muted">正在同步咨询师申请...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="review-grid">
      <article v-for="item in visibleReviews" :key="item.id" class="review-card">
        <div class="review-main">
          <div>
            <p class="eyebrow">{{ item.organization || "未填写组织" }}</p>
            <h3>{{ item.displayName }} · {{ item.title }}</h3>
            <p class="muted">真实姓名：{{ item.legalName || "-" }} / 编号：{{ item.staffId || "-" }}</p>
            <p class="muted">邮箱：{{ item.workEmail || "-" }}</p>
          </div>
          <t-tag :theme="item.status === 'pending_review' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'" variant="light">
            {{ item.status === "pending_review" ? "待审核" : item.status === "approved" ? "已启用" : "已停用" }}
          </t-tag>
        </div>
        <p>{{ item.intro }}</p>
        <p class="tag-row">
          <t-tag v-for="tag in item.specialties" :key="tag" variant="light">{{ tag }}</t-tag>
        </p>
        <div class="action-row">
          <t-button v-if="item.status === 'pending_review'" theme="primary" @click="approve(item)">通过并启用</t-button>
          <t-button v-if="item.status === 'pending_review'" theme="danger" variant="outline" @click="reject(item)">驳回</t-button>
          <t-button v-if="item.status !== 'pending_review'" variant="outline" @click="toggleStatus(item)">
            {{ item.status === "approved" ? "停用账号" : "重新启用" }}
          </t-button>
        </div>
      </article>
      <p v-if="!loading && visibleReviews.length === 0" class="empty-card">当前没有符合条件的咨询师申请。</p>
    </div>
  </AdminShell>
</template>
