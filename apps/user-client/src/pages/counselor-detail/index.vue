<template>
  <view class="page page-with-footer">
    <view class="top-nav">
      <text class="back-link" @click="goBack">‹</text>
      <view class="top-title">
        <text class="page-title compact-title">选择时间</text>
        <text class="muted">找一个你比较愿意说话的时间</text>
      </view>
    </view>

    <view v-if="counselor" class="selected-counselor-card">
      <view class="row-start">
        <view class="avatar avatar-small">{{ counselor.displayName.slice(0, 1) }}</view>
        <view>
          <text class="label-text">{{ counselor.displayName }}</text>
          <text class="muted">{{ counselor.title || "心理支持老师" }}</text>
        </view>
      </view>
      <view class="tag-row compact-tags">
        <text v-for="tag in counselor.specialties.slice(0, 3)" :key="tag" class="mini-tag">{{ tag }}</text>
      </view>
    </view>

    <view class="step-strip">
      <text class="step-item">选咨询师</text>
      <text class="step-item step-active">选时间</text>
      <text class="step-item">确认预约</text>
    </view>

    <view class="stack">
      <text v-if="loading" class="muted">正在同步可选时间...</text>
      <text v-if="error" class="error">{{ error }}</text>

      <view class="card stack time-card">
        <view class="row-between">
          <text class="label-text">可选时间</text>
          <text class="pill pill-soft">{{ slots.length }} 个可选</text>
        </view>

        <view v-for="group in slotGroups" :key="group.dateKey" class="slot-group">
          <view class="row-start">
            <text class="status-dot"></text>
            <text class="label">{{ group.label }}</text>
          </view>
          <view class="time-grid">
            <text
              v-for="slot in group.items"
              :key="slot.id"
              class="time-chip"
              :class="{ 'time-chip-active': slotId === slot.id }"
              @click="slotId = slot.id"
            >
              {{ formatClock(slot.startTime) }}
            </text>
          </view>
        </view>

        <view v-if="!loading && slots.length === 0" class="empty">
          <text class="label-text">暂时没有开放时段</text>
          <text class="muted">可以返回选择其他咨询师，或稍后再来查看。</text>
          <button class="button-light compact-button back-button" @click="goBack">返回选择咨询师</button>
        </view>
      </view>
    </view>

    <view class="summary-bar">
      <view class="row-between">
        <view>
          <text class="label">本次请求</text>
          <text class="muted">时间：{{ selectedSlot ? formatShortTime(selectedSlot.startTime) : "请选择" }}</text>
          <text class="muted">咨询师：{{ counselor?.displayName || "未选择" }}</text>
        </view>
        <view class="footer-actions">
          <button class="button-light compact-button" :disabled="!counselor || !slotId || submitting" @click="startRequest">填写说明</button>
          <button class="compact-button" :disabled="!counselor || !slotId || submitting" @click="confirmBooking">
            {{ submitting ? "提交中" : "确认预约" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { CounselorProfile, SupportSlot } from "@teacher-support/shared";
import { createRequest, getCounselor, listCounselorSlots } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";
import { saveLocalReceipt } from "../../utils/receipts";

interface SlotGroup {
  dateKey: string;
  label: string;
  items: SupportSlot[];
}

const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const counselorId = decodeURIComponent(current?.options?.id ?? "");
const assessmentId = decodeURIComponent(current?.options?.assessmentId ?? "");
const preferredName = decodeURIComponent(current?.options?.preferredName ?? "");
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
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (target.toDateString() === new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString()) {
    return `今天 ${date.getMonth() + 1}/${date.getDate()}`;
  }
  if (target.toDateString() === tomorrow.toDateString()) {
    return `明天 ${date.getMonth() + 1}/${date.getDate()}`;
  }
  return `${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

function startRequest() {
  if (!requireUserLogin("补充预约说明")) return;

  const query = [
    `counselorId=${encodeURIComponent(counselorId)}`,
    `slotId=${encodeURIComponent(slotId.value)}`,
    `assessmentId=${encodeURIComponent(assessmentId)}`,
    `preferredName=${encodeURIComponent(preferredName)}`
  ].join("&");
  uni.navigateTo({
    url: `/pages/request/index?${query}`
  });
}

async function confirmBooking() {
  error.value = "";
  if (!requireUserLogin("确认预约")) return;

  if (!counselor.value || !selectedSlot.value) {
    error.value = "请先选择一个可预约时间。";
    return;
  }

  const confirmed = await showBookingConfirm();
  if (!confirmed) return;

  submitting.value = true;
  try {
    const result = await createRequest({
      counselorId,
      slotId: selectedSlot.value.id,
      preferredName,
      assessmentId
    });
    saveLocalReceipt({
      kind: "support_request",
      receiptCode: result.receiptCode,
      itemId: result.id,
      title: `${counselor.value.displayName} · 匿名预约`,
      createdAt: new Date().toISOString()
    });
    uni.redirectTo({ url: `/pages/receipt/index?code=${encodeURIComponent(result.receiptCode)}` });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "预约暂时没有成功";
  } finally {
    submitting.value = false;
  }
}

function showBookingConfirm() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "确认预约",
      content: `${counselor.value?.displayName ?? "咨询师"} · ${selectedSlot.value ? formatShortTime(selectedSlot.value.startTime) : ""}\n提交后会生成匿名回执码，可在“我的预约”中查看或撤回。`,
      confirmText: "确认预约",
      cancelText: "再看看",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false)
    });
  });
}

function goBack() {
  uni.navigateBack();
}

async function load() {
  if (!counselorId) {
    error.value = "缺少咨询师信息，请返回后重新选择。";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const [profile, availableSlots] = await Promise.all([getCounselor(counselorId), listCounselorSlots(counselorId)]);
    counselor.value = profile;
    slots.value = availableSlots;
    slotId.value = availableSlots[0]?.id ?? "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "咨询师信息暂时不可用";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.slot-group {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.selected-counselor-card {
  border: 1rpx solid rgba(95, 105, 137, 0.1);
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20rpx 54rpx rgba(28, 38, 70, 0.07);
  padding: 26rpx;
}

.compact-tags {
  margin-top: 20rpx;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
}

.time-card {
  box-shadow: none;
  background: transparent;
  border: 0;
  padding: 0;
}

.footer-actions {
  display: flex;
  gap: 12rpx;
}

.back-button {
  margin-top: 18rpx;
}
</style>
