<template>
  <view class="page page-with-footer">
    <!-- #ifdef H5 -->
    <view class="h5-flow-header">
      <view>
        <text class="h5-flow-title">确认预约</text>
        <text class="h5-flow-subtitle">预约流程 3 / 3 · 只填写你愿意留下的内容</text>
      </view>
      <button class="button-light" @click="goBack">返回上一步</button>
    </view>
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <view class="top-nav">
      <text class="back-link" @click="goBack">‹</text>
      <view class="top-title">
        <text class="page-title compact-title">确认预约</text>
        <text class="muted">请确认以下信息</text>
      </view>
    </view>
    <!-- #endif -->

    <view class="confirm-card">
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
        <text class="detail-value">线下 / 线上支持</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">时长</text>
        <text class="detail-value">约 50 分钟</text>
      </view>
    </view>

    <view class="card stack">
      <view class="field">
        <text class="label">希望被如何称呼（可选）</text>
        <input v-model="preferredName" placeholder="昵称、代称或留空" />
      </view>
      <view class="field">
        <text class="label">邮箱（可选）</text>
        <input v-model="contactEmail" placeholder="仅在你希望被联系时填写" />
      </view>
      <view class="field">
        <text class="label">补充说明（可选）</text>
        <textarea v-model="remark" maxlength="600" placeholder="只写你愿意表达的部分" />
        <text class="muted">{{ remark.length }}/600</text>
      </view>
    </view>

    <view class="privacy-tip">
      <text class="mini-tag">隐私提示</text>
      <text class="muted">你的信息仅用于本次预约。确认后会生成回执码，可用于查看状态或撤回。</text>
    </view>

    <text v-if="error" class="error">{{ error }}</text>

    <view class="summary-bar">
      <button class="full-confirm" :disabled="submitting || !slotId" @click="submit">
        {{ submitting ? "确认中" : "确认预约" }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";
import type { SupportSlot } from "@teacher-support/shared";
import { createRequest, getCounselor, listCounselorSlots } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";
import { replacePage } from "../../utils/navigation";
import { saveLocalReceipt } from "../../utils/receipts";

const slots = ref<SupportSlot[]>([]);
const counselorId = ref("");
const counselorName = ref("");
const slotId = ref("");
const preferredName = ref("");
const assessmentId = ref("");
const contactEmail = ref("");
const remark = ref("");
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
  try {
    const [profile, availableSlots] = await Promise.all([getCounselor(counselorId.value), listCounselorSlots(counselorId.value)]);
    counselorName.value = profile.displayName;
    slots.value = availableSlots;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "时段暂时不可用";
  }
}

async function submit() {
  error.value = "";
  if (!requireUserLogin("确认预约")) return;
  if (!counselorId.value || !slotId.value) {
    error.value = "请先完成咨询师和时间选择。";
    return;
  }
  if (contactEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.value)) {
    error.value = "邮箱格式看起来不正确。";
    return;
  }

  const confirmed = await showConfirm();
  if (!confirmed) return;

  submitting.value = true;
  try {
    const result = await createRequest({
      counselorId: counselorId.value,
      slotId: slotId.value,
      preferredName: preferredName.value,
      assessmentId: assessmentId.value,
      contactEmail: contactEmail.value,
      remark: remark.value
    });
    saveLocalReceipt({
      kind: "support_request",
      receiptCode: result.receiptCode,
      itemId: result.id,
      title: `${counselorName.value || "咨询师"} · 预约`,
      createdAt: new Date().toISOString()
    });
    replacePage(`/pages/receipt/index?code=${encodeURIComponent(result.receiptCode)}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "预约暂时没有成功";
  } finally {
    submitting.value = false;
  }
}

function showConfirm() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "确认预约",
      content: `${counselorName.value || "已选咨询师"} · ${selectedSlot.value ? formatShortTime(selectedSlot.value.startTime) : ""}\n确认后会生成预约回执码。`,
      confirmText: "确认预约",
      cancelText: "再看看",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false)
    });
  });
}

function goBack() {
  uni.navigateBack({
    fail: () => {
      replacePage(counselorId.value ? `/pages/counselor-detail/index?id=${encodeURIComponent(counselorId.value)}` : "/pages/counselors/index");
    }
  });
}

onLoad((options = {}) => {
  counselorId.value = typeof options.counselorId === "string" ? decodeURIComponent(options.counselorId) : "";
  slotId.value = typeof options.slotId === "string" ? decodeURIComponent(options.slotId) : "";
  preferredName.value = typeof options.preferredName === "string" ? decodeURIComponent(options.preferredName) : "";
  assessmentId.value = typeof options.assessmentId === "string" ? decodeURIComponent(options.assessmentId) : "";
  void loadSlots();
});

onMounted(() => {
  if (counselorId.value && slots.value.length === 0) {
    void loadSlots();
  }
});
</script>

<style scoped>
.confirm-card {
  overflow: hidden;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  border-bottom: 1rpx solid #edf0f6;
  padding: 30rpx;
}

.detail-row:last-child {
  border-bottom: 0;
}

.detail-label {
  color: #64748b;
  font-size: 25rpx;
}

.detail-value {
  max-width: 430rpx;
  color: #2563eb;
  font-size: 26rpx;
  font-weight: 800;
  text-align: right;
}

.privacy-tip {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-top: 24rpx;
  border-radius: 28rpx;
  background: #f7f9ff;
  padding: 24rpx;
}

.full-confirm {
  width: 100%;
}
</style>
