<template>
  <view class="page">
    <view class="success-hero">
      <view class="success-mark">✓</view>
      <text class="title">预约成功</text>
      <text class="copy">你的预约已提交，当前状态为待确认。后续可以在“我的预约”中查看状态变化。</text>
    </view>

    <view v-if="loading" class="card">
      <text class="muted">正在生成预约确认单...</text>
    </view>

    <view v-else-if="appointment" class="confirm-ticket">
      <view class="row-between ticket-header">
        <view>
          <text class="muted">预约确认单</text>
          <text class="ticket-title">{{ appointment.counselorName || "咨询师" }}</text>
        </view>
        <text class="pill pill-soft">{{ requestStatusLabels[appointment.status] }}</text>
      </view>

      <view class="ticket-lines">
        <view class="ticket-row">
          <text>日期</text>
          <text>{{ formatDate(appointment.slotStartTime) }}</text>
        </view>
        <view class="ticket-row">
          <text>时间</text>
          <text>{{ formatTimeRange(appointment.slotStartTime, appointment.slotEndTime) }}</text>
        </view>
        <view class="ticket-row">
          <text>方式</text>
          <text>{{ appointment.mode ? supportSlotModeLabels[appointment.mode] : "待确认" }}</text>
        </view>
        <view class="ticket-row">
          <text>地点/说明</text>
          <text>{{ appointment.location || appointment.note || "确认后补充" }}</text>
        </view>
        <view class="ticket-row">
          <text>时长</text>
          <text>{{ durationText(appointment.slotStartTime, appointment.slotEndTime) }}</text>
        </view>
      </view>

      <view v-if="appointment.assessmentId" class="assessment-summary">
        <view class="row-between">
          <text class="label-text">关联测评结果</text>
          <text class="mini-tag">{{ assessmentRiskText(appointment) }}</text>
        </view>
        <text class="muted">{{ assessmentScoreText(appointment) }}</text>
      </view>

      <view class="receipt-actions">
        <button class="button-light compact-button" @click="go('/pages/requests/index')">查看我的预约</button>
        <button class="button-soft compact-button" @click="go('/pages/index/index')">返回首页</button>
      </view>
    </view>

    <view v-else class="card empty">
      <text class="label-text">没有找到这条预约</text>
      <text class="muted">{{ error || "可以回到我的预约刷新查看。" }}</text>
      <button class="compact-button empty-action" @click="go('/pages/requests/index')">查看我的预约</button>
    </view>

    <view class="warm-note">
      <text class="label-text">温馨提示</text>
      <text class="muted">如有特殊情况需要调整，可以在“我的预约”中撤回后重新选择合适时间。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import {
  assessmentRiskLabels,
  requestStatusLabels,
  supportSlotModeLabels,
  type SupportRequestSummary
} from "@teacher-support/shared";
import { listUserAppointments } from "../../api/client";
import { openPage } from "../../utils/navigation";

const appointmentId = ref("");
const loading = ref(false);
const error = ref("");
const appointment = ref<SupportRequestSummary | null>(null);

function go(url: string) {
  openPage(url);
}

function formatDate(value?: string) {
  if (!value) return "待确认";
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]}`;
}

function formatTimeRange(start?: string, end?: string) {
  if (!start) return "待确认";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const startText = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endText = endDate ? endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return endText ? `${startText}-${endText}` : startText;
}

function durationText(start?: string, end?: string) {
  if (!start || !end) return "约 50 分钟";
  return `${Math.max(Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000), 1)} 分钟`;
}

function assessmentRiskText(item: SupportRequestSummary) {
  return item.assessmentRiskLevel ? assessmentRiskLabels[item.assessmentRiskLevel] : "已关联";
}

function assessmentScoreText(item: SupportRequestSummary) {
  const scores = item.assessmentScoreSummary ?? [];
  if (!scores.length) {
    return "这次预约已关联测评结果，咨询师端仅展示摘要信息。";
  }
  return scores.map((score) => `${score.label} ${score.rawScore}/${score.maxScore}`).join(" · ");
}

async function loadAppointment() {
  if (!appointmentId.value) {
    error.value = "缺少预约信息。";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const appointments = await listUserAppointments();
    appointment.value = appointments.find((item) => item.id === appointmentId.value) ?? null;
    if (!appointment.value) {
      error.value = "预约可能仍在同步，请稍后到我的预约查看。";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "预约确认单暂时无法加载";
  } finally {
    loading.value = false;
  }
}

onLoad((options = {}) => {
  appointmentId.value = typeof options.id === "string" ? decodeURIComponent(options.id) : "";
  void loadAppointment();
});
</script>

<style scoped>
.success-hero {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 78rpx 24rpx 44rpx;
  text-align: center;
}

.success-hero .title {
  max-width: none;
}

.success-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 124rpx;
  height: 124rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 24rpx 60rpx rgba(37, 99, 235, 0.22);
  font-size: 64rpx;
  font-weight: 900;
}

.confirm-ticket {
  overflow: hidden;
  border-radius: 36rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
}

.ticket-header {
  padding: 32rpx;
}

.ticket-title {
  display: block;
  margin-top: 8rpx;
  color: #111827;
  font-size: 34rpx;
  font-weight: 900;
}

.ticket-lines {
  border-top: 1rpx solid #edf0f6;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  gap: 28rpx;
  border-bottom: 1rpx solid #edf0f6;
  padding: 28rpx 32rpx;
  color: #64748b;
  font-size: 26rpx;
}

.ticket-row text:last-child {
  max-width: 450rpx;
  color: #1f2937;
  font-weight: 800;
  text-align: right;
}

.receipt-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  padding: 28rpx 32rpx 32rpx;
}

.assessment-summary {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  border-top: 1rpx solid #edf0f6;
  background: #f8fbff;
  padding: 28rpx 32rpx;
}

.warm-note {
  margin-top: 32rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 30rpx;
}

.empty-action {
  margin-top: 22rpx;
}
</style>
