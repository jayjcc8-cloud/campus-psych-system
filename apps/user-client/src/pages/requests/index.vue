<template>
  <view class="page">
    <!-- #ifdef MP-WEIXIN -->
    <text class="page-title">我的预约</text>
    <!-- #endif -->

    <view v-if="!hasLogin" class="card empty">
      <text class="label-text">登录后查看预约</text>
      <text class="muted">预约记录会同步到你的邮箱账号，换设备登录后也能查看。</text>
      <button class="compact-button empty-action" @click="go('/pages/login/index')">去登录</button>
    </view>

    <template v-else>
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

        <view
          v-for="item in visibleAppointments"
          :key="item.id"
          class="appointment-card interactive"
          @click="open(item)"
        >
          <view class="row-between">
            <text class="pill" :class="isActiveStatus(item.status) ? 'pill-soft' : ''">
              {{ requestStatusLabels[item.status] }}
            </text>
            <text class="muted">
              {{
                item.slotStartTime ? distanceHint(item.slotStartTime) : formatCreatedAt(item.createdAt)
              }}
            </text>
          </view>
          <view class="appointment-main">
            <view class="avatar avatar-small">{{ (item.counselorName || "咨").slice(0, 1) }}</view>
            <view>
              <text class="label-text">{{ item.counselorName || "咨询师" }}</text>
              <text class="copy">{{ formatAppointmentTime(item.slotStartTime, item.slotEndTime) }}</text>
              <text class="muted">
                {{ item.mode ? supportSlotModeLabels[item.mode] : "预约方式待确认" }} ·
                {{ item.location || item.note || "地点待确认" }}
              </text>
              <text v-if="item.assessmentId" class="muted">
                测评摘要：{{ assessmentSummaryText(item) }}
              </text>
            </view>
          </view>
          <view class="appointment-actions">
            <button class="button-light compact-button" @click.stop="open(item)">详情</button>
            <button
              v-if="isActiveStatus(item.status)"
              class="button-soft compact-button"
              :disabled="withdrawingId === item.id"
              @click.stop="withdraw(item)"
            >
              {{ withdrawingId === item.id ? "处理中" : "撤回预约" }}
            </button>
          </view>
        </view>

        <view v-if="!loading && visibleAppointments.length === 0" class="card empty">
          <text class="label-text">{{ appointments.length ? "当前分组没有记录" : "还没有预约" }}</text>
          <text class="muted">
            {{
              appointments.length ? "可以切换到另一个分组查看。" : "从首页开始预约后，会自动同步到这里。"
            }}
          </text>
          <button
            v-if="!appointments.length"
            class="compact-button empty-action"
            @click="go('/pages/counselors/index')"
          >
            开始预约
          </button>
        </view>

        <text v-if="error" class="error">{{ error }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import {
  requestStatusLabels,
  assessmentRiskLabels,
  supportSlotModeLabels,
  type SupportRequestStatus,
  type SupportRequestSummary
} from "@teacher-support/shared";
import { getUserToken, listUserAppointments, withdrawUserAppointment } from "../../api/client";
import { openPage } from "../../utils/navigation";

const tab = ref<"active" | "history">("active");
const loading = ref(false);
const withdrawingId = ref("");
const error = ref("");
const hasLogin = ref(false);
const appointments = ref<SupportRequestSummary[]>([]);
const activeAppointments = computed(() => appointments.value.filter((item) => isActiveStatus(item.status)));
const historyAppointments = computed(() => appointments.value.filter((item) => !isActiveStatus(item.status)));
const visibleAppointments = computed(() =>
  tab.value === "active" ? activeAppointments.value : historyAppointments.value
);

function isActiveStatus(status?: SupportRequestStatus) {
  return !status || ["new", "viewed", "noted"].includes(status);
}

function open(item: SupportRequestSummary) {
  openPage(`/pages/receipt/index?id=${encodeURIComponent(item.id)}`);
}

function go(url: string) {
  openPage(url);
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatAppointmentTime(start?: string, end?: string) {
  if (!start) return "时间待确认";
  const date = new Date(start);
  const endDate = end ? new Date(end) : null;
  const startText = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endText = endDate ? endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return `${date.getMonth() + 1}/${date.getDate()} ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]} ${endText ? `${startText}-${endText}` : startText}`;
}

function assessmentSummaryText(item: SupportRequestSummary) {
  const risk = item.assessmentRiskLevel ? assessmentRiskLabels[item.assessmentRiskLevel] : "已关联";
  const scores = item.assessmentScoreSummary ?? [];
  if (!scores.length) {
    return risk;
  }
  return `${risk} · ${scores.map((score) => `${score.label}${score.rawScore}/${score.maxScore}`).join(" · ")}`;
}

function distanceHint(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "已开始";
  const days = Math.ceil(diff / 86400000);
  return `${days}天后`;
}

async function withdraw(item: SupportRequestSummary) {
  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "撤回预约",
      content: "撤回后这次预约将不再保留有效状态，如需支持可以重新选择时间。",
      confirmText: "撤回",
      cancelText: "再看看",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false)
    });
  });
  if (!confirmed) return;

  withdrawingId.value = item.id;
  error.value = "";
  try {
    await withdrawUserAppointment(item.id);
    await refreshAppointments();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "撤回暂时没有成功";
  } finally {
    withdrawingId.value = "";
  }
}

async function refreshAppointments() {
  hasLogin.value = Boolean(getUserToken());
  if (!hasLogin.value) {
    appointments.value = [];
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    appointments.value = await listUserAppointments();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "预约状态暂时不可用";
  } finally {
    loading.value = false;
  }
}

function syncRequestsChrome() {
  // #ifdef MP-WEIXIN
  uni.showTabBar();
  // #endif
}

function handleShow() {
  syncRequestsChrome();
  void refreshAppointments();
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
