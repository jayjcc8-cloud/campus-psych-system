<template>
  <view class="page page-with-footer">
    <view class="top-nav">
      <text class="back-link" @click="goBack">‹</text>
      <view class="top-title">
        <text class="page-title compact-title">填写预约信息</text>
        <text class="muted">只填写你愿意留下的内容</text>
      </view>
    </view>

    <view class="step-strip">
      <text class="step-item">选咨询师</text>
      <text class="step-item">选时间</text>
      <text class="step-item step-active">确认预约</text>
    </view>

    <view class="card stack-small">
      <view class="row-start">
        <view class="avatar avatar-small">{{ counselorName.slice(0, 1) || "咨" }}</view>
        <view>
          <text class="label-text">{{ counselorName || "已选咨询师" }}</text>
          <text class="muted">{{ selectedSlot ? formatFullTime(selectedSlot.startTime) : "请选择一个开放时段" }}</text>
        </view>
      </view>
    </view>

    <view class="stack">
      <view class="card detail-list">
        <view class="detail-row">
          <text class="detail-label">咨询师</text>
          <text class="detail-value">{{ counselorName || "已选咨询师" }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">时间</text>
          <text class="detail-value">{{ selectedSlot ? formatFullTime(selectedSlot.startTime) : "未选择" }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">形式</text>
          <text class="detail-value">匿名支持请求</text>
        </view>
        <button class="button-light" @click="goBack">修改时间或咨询师</button>
      </view>

      <view class="card stack">
        <view class="hint-card">
          <text class="label-text">匿名边界</text>
          <view class="meta-line">
            <text class="mini-tag">称呼可空</text>
            <text class="mini-tag">邮箱可空</text>
            <text class="mini-tag">可撤回</text>
          </view>
        </view>
        <view class="field">
          <text class="label">希望被如何称呼</text>
          <input v-model="preferredName" placeholder="可留空，也可填写昵称或代称" />
        </view>
        <view class="field">
          <text class="label">邮箱</text>
          <input v-model="contactEmail" placeholder="可选，仅在你希望被联系时填写" />
        </view>
        <view class="field">
          <text class="label">其他联系方式</text>
          <input v-model="contactNote" placeholder="可选，例如办公邮箱、内线或其他方式" />
        </view>
        <view class="field">
          <text class="label">补充说明</text>
          <textarea v-model="remark" maxlength="600" placeholder="可选，只写你愿意表达的部分" />
          <text class="text-count">{{ remark.length }}/600</text>
        </view>
      </view>

      <view class="card soft-card">
        <text class="label-text">提交后会发生什么</text>
        <text class="copy">系统会生成匿名回执码，用于查看状态或撤回。联系方式不填写也可以提交。</text>
      </view>

      <text v-if="error" class="error">{{ error }}</text>
    </view>

    <view class="summary-bar">
      <view class="row-between">
        <view>
          <text class="label">本次预约</text>
          <text class="muted">{{ selectedSlot ? `${counselorName} · ${formatShortTime(selectedSlot.startTime)}` : "请先选择时间" }}</text>
        </view>
        <button class="compact-button" :disabled="submitting || !slotId" @click="submit">
          {{ submitting ? "提交中" : "确认预约" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { SupportSlot } from "@teacher-support/shared";
import { createRequest, getCounselor, listCounselorSlots } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";
import { saveLocalReceipt } from "../../utils/receipts";

const slots = ref<SupportSlot[]>([]);
const counselorId = ref("");
const counselorName = ref("");
const slotId = ref("");
const preferredName = ref("");
const assessmentId = ref("");
const contactEmail = ref("");
const contactNote = ref("");
const remark = ref("");
const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const selectedSlot = computed(() => slots.value.find((slot) => slot.id === slotId.value));

function formatShortTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatFullTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

async function loadSlots() {
  if (!counselorId.value) {
    error.value = "请先选择一位咨询师。";
    return;
  }

  loading.value = true;
  try {
    const [profile, availableSlots] = await Promise.all([getCounselor(counselorId.value), listCounselorSlots(counselorId.value)]);
    counselorName.value = profile.displayName;
    slots.value = availableSlots;
    if (!slotId.value || !availableSlots.some((slot) => slot.id === slotId.value)) {
      slotId.value = availableSlots[0]?.id ?? "";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "时段暂时不可用";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  error.value = "";
  if (!requireUserLogin("提交预约请求")) return;

  if (!counselorId.value) {
    error.value = "请先选择一位咨询师。";
    return;
  }
  if (!slotId.value) {
    error.value = "请选择一个开放时段。";
    return;
  }
  if (contactEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.value)) {
    error.value = "邮箱格式看起来不正确。";
    return;
  }

  const confirm = await showConfirm();
  if (!confirm) return;

  submitting.value = true;
  try {
    const result = await createRequest({
      counselorId: counselorId.value,
      slotId: slotId.value,
      preferredName: preferredName.value,
      assessmentId: assessmentId.value,
      contactEmail: contactEmail.value,
      contactNote: contactNote.value,
      remark: remark.value
    });
    saveLocalReceipt({
      kind: "support_request",
      receiptCode: result.receiptCode,
      itemId: result.id,
      title: preferredName.value || "匿名支持请求",
      createdAt: new Date().toISOString()
    });
    uni.redirectTo({ url: `/pages/receipt/index?code=${encodeURIComponent(result.receiptCode)}` });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "提交暂时没有成功";
  } finally {
    submitting.value = false;
  }
}

function showConfirm() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "确认提交",
      content: "提交后将生成匿名回执码。你可以之后查看状态或撤回预约。",
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

const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
counselorId.value = decodeURIComponent(current?.options?.counselorId ?? "");
slotId.value = decodeURIComponent(current?.options?.slotId ?? "");
preferredName.value = decodeURIComponent(current?.options?.preferredName ?? "");
assessmentId.value = decodeURIComponent(current?.options?.assessmentId ?? "");

onMounted(loadSlots);
</script>

<style scoped>
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  border-bottom: 1rpx solid #edf0f6;
  padding: 24rpx 0;
}

.detail-row:first-child {
  padding-top: 0;
}

.detail-row:nth-child(3) {
  border-bottom: 0;
}

.detail-label {
  color: #667085;
  font-size: 25rpx;
}

.detail-value {
  max-width: 430rpx;
  color: #263a59;
  font-size: 26rpx;
  font-weight: 760;
  text-align: right;
}
</style>
