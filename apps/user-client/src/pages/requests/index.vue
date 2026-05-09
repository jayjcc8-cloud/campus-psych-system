<template>
  <view class="page">
    <!-- #ifdef H5 -->
    <view class="h5-flow-header">
      <view>
        <text class="h5-flow-title">我的预约</text>
        <text class="h5-flow-subtitle">查看本机回执、预约状态和后续处理</text>
      </view>
      <button class="h5-link-button" @click="go('/pages/index/index')">返回首页</button>
    </view>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <text class="page-title">我的预约</text>
    <!-- #endif -->

    <view class="segment">
      <button class="segment-item" :class="{ 'segment-active': tab === 'active' }" @click="tab = 'active'">
        即将开始
      </button>
      <button class="segment-item" :class="{ 'segment-active': tab === 'history' }" @click="tab = 'history'">
        历史记录
      </button>
    </view>

    <view class="stack">
      <text v-if="loading" class="muted">正在同步预约状态...</text>

      <view v-for="item in visibleAppointments" :key="item.receipt.receiptCode" class="appointment-card interactive" @click="open(item.receipt)">
        <view class="row-between">
          <text class="pill" :class="isActiveStatus(item.detail?.status) ? 'pill-soft' : ''">
            {{ item.detail ? requestStatusLabels[item.detail.status] : "待查看状态" }}
          </text>
          <text class="muted">{{ item.detail?.slotStartTime ? distanceHint(item.detail.slotStartTime) : formatCreatedAt(item.receipt.createdAt) }}</text>
        </view>
        <view class="appointment-main">
          <view class="avatar avatar-small">{{ (item.detail?.counselorName || item.receipt.title || "咨").slice(0, 1) }}</view>
          <view>
            <text class="label-text">{{ item.detail?.counselorName || item.receipt.title }}</text>
            <text class="copy">{{ item.detail?.slotStartTime ? formatAppointmentTime(item.detail.slotStartTime) : "时间待查询" }}</text>
            <text class="muted">线下/线上支持 · 回执 {{ item.receipt.receiptCode }}</text>
          </view>
        </view>
        <text v-if="item.error" class="error">{{ item.error }}</text>
        <view class="appointment-actions">
          <button class="button-light compact-button" @click.stop="open(item.receipt)">详情</button>
          <button class="button-soft compact-button" @click.stop="openLookup">手动查询</button>
        </view>
      </view>

      <view v-if="!loading && visibleAppointments.length === 0" class="card empty">
        <text class="label-text">{{ appointmentItems.length ? "当前分组没有记录" : "还没有预约" }}</text>
        <text class="muted">{{ appointmentItems.length ? "可以切换到另一个分组查看。" : "从首页开始预约后，回执会自动保存在这里。" }}</text>
        <button v-if="!appointmentItems.length" class="compact-button empty-action" @click="go('/pages/counselors/index')">开始预约</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { requestStatusLabels, type SupportRequestStatus, type SupportRequestSummary } from "@teacher-support/shared";
import { getRequestByReceipt } from "../../api/client";
import { openPage } from "../../utils/navigation";
import { listLocalReceipts, type LocalReceipt } from "../../utils/receipts";

interface AppointmentItem {
  receipt: LocalReceipt;
  detail: SupportRequestSummary | null;
  error?: string;
}

const tab = ref<"active" | "history">("active");
const loading = ref(false);
const appointmentItems = ref<AppointmentItem[]>([]);
const activeAppointments = computed(() => appointmentItems.value.filter((item) => isActiveStatus(item.detail?.status)));
const historyAppointments = computed(() => appointmentItems.value.filter((item) => !isActiveStatus(item.detail?.status)));
const visibleAppointments = computed(() => (tab.value === "active" ? activeAppointments.value : historyAppointments.value));

function isActiveStatus(status?: SupportRequestStatus) {
  return !status || ["new", "viewed", "noted"].includes(status);
}

function open(item: LocalReceipt) {
  uni.navigateTo({ url: `/pages/lookup/index?code=${encodeURIComponent(item.receiptCode)}` });
}

function openLookup() {
  uni.navigateTo({ url: "/pages/lookup/index" });
}

function go(url: string) {
  openPage(url);
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatAppointmentTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function distanceHint(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "已开始";
  const days = Math.ceil(diff / 86400000);
  return `${days}天后`;
}

async function refreshReceipts() {
  const receipts = listLocalReceipts().filter((item) => item.kind === "support_request");
  loading.value = true;
  appointmentItems.value = await Promise.all(
    receipts.map(async (receipt) => {
      try {
        return { receipt, detail: await getRequestByReceipt(receipt.receiptCode) };
      } catch (err) {
        return { receipt, detail: null, error: err instanceof Error ? err.message : "状态暂时不可用" };
      }
    })
  );
  loading.value = false;
}

function syncRequestsChrome() {
  // #ifdef H5
  uni.hideTabBar();
  // #endif

  // #ifdef MP-WEIXIN
  uni.showTabBar();
  // #endif
}

function handleShow() {
  syncRequestsChrome();
  void refreshReceipts();
}

onShow(handleShow);
</script>

<style scoped>
.appointment-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  border-radius: 34rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 28rpx;
}

.appointment-main {
  display: flex;
  gap: 18rpx;
}

.appointment-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  border-top: 1rpx solid #edf0f6;
  padding-top: 18rpx;
}

.empty-action {
  margin-top: 22rpx;
}
</style>
