<template>
  <view class="page page-with-footer">
    <!-- #ifdef H5 -->
    <view class="h5-flow-header">
      <view>
        <text class="h5-flow-title">选择时间</text>
        <text class="h5-flow-subtitle">预约流程 2 / 3 · 找一个适合说话的时间</text>
      </view>
      <button class="button-light" @click="goBack">返回上一步</button>
    </view>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <view class="top-nav">
      <text class="back-link" @click="goBack">‹</text>
      <view class="top-title">
        <text class="page-title compact-title">选择时间</text>
        <text class="muted">找一个你比较愿意说话的时间</text>
      </view>
    </view>
    <!-- #endif -->

    <view v-if="counselor" class="teacher-card">
      <view class="row-start">
        <view class="portrait">{{ counselor.displayName.slice(0, 1) }}</view>
        <view>
          <text class="label-text">{{ counselor.displayName }}</text>
          <text class="muted">{{ counselor.title || "心理支持咨询师" }}</text>
        </view>
      </view>
      <view class="tag-row">
        <text v-for="tag in counselor.specialties.slice(0, 4)" :key="tag" class="mini-tag">{{ tag }}</text>
      </view>
    </view>

    <view class="step-strip">
      <text class="step-item">选择咨询师</text>
      <text class="step-item step-active">选择时间</text>
      <text class="step-item">确认预约</text>
    </view>

    <view class="stack">
      <text v-if="loading" class="muted">正在同步可选时间...</text>
      <text v-if="error" class="error">{{ error }}</text>

      <view v-for="group in slotGroups" :key="group.dateKey" class="slot-section">
        <view class="slot-title-row">
          <text class="calendar-icon">▣</text>
          <text class="label-text">{{ group.label }}</text>
        </view>
        <view class="time-grid">
          <button
            v-for="slot in group.items"
            :key="slot.id"
            class="time-chip"
            :class="{ 'time-chip-active': slotId === slot.id }"
            @click="slotId = slot.id"
          >
            {{ formatClock(slot.startTime) }}
          </button>
        </view>
      </view>

      <view v-if="!loading && slots.length === 0" class="card empty">
        <text class="label-text">暂时没有开放时段</text>
        <text class="muted">可以返回选择其他咨询师，或稍后再来查看。</text>
        <button class="button-light compact-button empty-action" @click="goBack">返回选择咨询师</button>
      </view>
    </view>

    <view class="summary-bar">
      <view class="row-between">
        <view>
          <text class="label">本次预约</text>
          <text class="muted">时间：{{ selectedSlot ? formatShortTime(selectedSlot.startTime) : "请选择" }}</text>
          <text class="muted">咨询师：{{ counselor?.displayName || "未选择" }}</text>
        </view>
        <button class="compact-button" :disabled="!counselor || !slotId || submitting" @click="startRequest">下一步</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import type { CounselorProfile, SupportSlot } from "@teacher-support/shared";
import { getCounselor, listCounselorSlots } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";

interface SlotGroup {
  dateKey: string;
  label: string;
  items: SupportSlot[];
}

const counselorId = ref("");
const assessmentId = ref("");
const preferredName = ref("");
const counselor = ref<CounselorProfile | null>(null);
const slots = ref<SupportSlot[]>([]);
const slotId = ref("");
const loading = ref(false);
const submitting = ref(false);
const error = ref("");

const selectedSlot = computed(() => slots.value.find((slot) => slot.id === slotId.value));
const slotGroups = computed<SlotGroup[]>(() => {
  const groups = new Map<string, SupportSlot[]>();
  slots.value.forEach((slot) => {
    const date = new Date(slot.startTime);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  });
  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateKey,
    label: formatDateLabel(items[0].startTime),
    items
  }));
});

function formatClock(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatShortTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${formatClock(value)}`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (target.toDateString() === today.toDateString()) return `今天 ${date.getMonth() + 1}/${date.getDate()}`;
  if (target.toDateString() === tomorrow.toDateString()) return `明天 ${date.getMonth() + 1}/${date.getDate()}`;
  return `${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

function startRequest() {
  if (!requireUserLogin("确认预约")) return;
  if (!selectedSlot.value) {
    error.value = "请先选择一个可预约时间。";
    return;
  }
  const query = [
    `counselorId=${encodeURIComponent(counselorId.value)}`,
    `slotId=${encodeURIComponent(selectedSlot.value.id)}`,
    `assessmentId=${encodeURIComponent(assessmentId.value)}`,
    `preferredName=${encodeURIComponent(preferredName.value)}`
  ].join("&");
  const url = `/pages/request/index?${query}`;
  uni.navigateTo({
    url,
    fail: () => {
      uni.reLaunch({ url });
    }
  });
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: "/pages/counselors/index" });
}

async function load() {
  if (!counselorId.value) {
    error.value = "缺少咨询师信息，请返回后重新选择。";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const [profile, availableSlots] = await Promise.all([getCounselor(counselorId.value), listCounselorSlots(counselorId.value)]);
    counselor.value = profile;
    slots.value = availableSlots;
    slotId.value = availableSlots[0]?.id ?? "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "咨询师信息暂时不可用";
  } finally {
    loading.value = false;
  }
}

onLoad((options) => {
  counselorId.value = typeof options?.id === "string" ? decodeURIComponent(options.id) : "";
  assessmentId.value = typeof options?.assessmentId === "string" ? decodeURIComponent(options.assessmentId) : "";
  preferredName.value = typeof options?.preferredName === "string" ? decodeURIComponent(options.preferredName) : "";
  void load();
});
</script>

<style scoped>
.teacher-card {
  border-radius: 34rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 28rpx;
}

.portrait {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110rpx;
  height: 110rpx;
  border-radius: 40rpx;
  background:
    radial-gradient(circle at 34% 20%, rgba(255, 220, 210, 0.84), transparent 25%),
    linear-gradient(145deg, #eef4ff, #dde4ff);
  color: #2563eb;
  font-size: 34rpx;
  font-weight: 900;
}

.teacher-card .tag-row {
  margin-top: 20rpx;
}

.slot-section {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.slot-title-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 12rpx;
}

.calendar-icon {
  color: #2563eb;
  font-size: 28rpx;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
}

.time-chip {
  min-height: 72rpx;
  padding: 0;
}

.empty-action {
  margin-top: 22rpx;
}
</style>
