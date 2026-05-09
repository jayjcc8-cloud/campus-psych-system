<template>
  <view class="page page-with-footer">
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
        <text class="detail-value">
          {{
            selectedSlot ? formatFullRange(selectedSlot.startTime, selectedSlot.endTime) : "未选择"
          }}
        </text>
      </view>
      <view class="detail-row">
        <text class="detail-label">形式</text>
        <text class="detail-value">{{ selectedSlot ? supportSlotModeLabels[selectedSlot.mode] : "待选择" }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">地点/说明</text>
        <text class="detail-value">{{ selectedSlot?.location || selectedSlot?.note || "确认后补充" }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">时长</text>
        <text class="detail-value">
          {{
            selectedSlot ? `${durationMinutes(selectedSlot.startTime, selectedSlot.endTime)} 分钟` : "约 50 分钟"
          }}
        </text>
      </view>
    </view>

    <view v-if="assessmentId" class="assessment-link-card">
      <view class="row-between">
        <text class="label-text">已关联测评结果</text>
        <text class="mini-tag">{{ linkedAssessment?.riskLabel || "摘要" }}</text>
      </view>
      <text class="muted">
        {{ linkedAssessment?.summary || "咨询师仅能看到风险等级和三项量表摘要，不会看到逐题答案。" }}
      </text>
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
      <text class="muted">你的信息仅用于本次预约。确认后可在“我的预约”中查看状态或撤回。</text>
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
import { assessmentRiskLabels, supportSlotModeLabels, type AssessmentRiskLevel, type AssessmentScaleScore, type SupportSlot } from "@teacher-support/shared";
import { createRequest, getCounselor, listCounselorSlots } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";
import { replacePage } from "../../utils/navigation";

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
const linkedAssessment = computed(() => {
  if (!assessmentId.value) return null;
  const stored = uni.getStorageSync(`assessment_summary:${assessmentId.value}`) as
    | {
        riskLevel?: AssessmentRiskLevel;
        scoreSummary?: AssessmentScaleScore[];
      }
    | "";
  if (!stored || typeof stored !== "object") {
    return {
      riskLabel: "已关联",
      summary: "咨询师仅能看到风险等级和三项量表摘要，不会看到逐题答案。"
    };
  }
  const scores = stored.scoreSummary ?? [];
  const scoreText = scores.map((score) => `${score.label}${score.rawScore}/${score.maxScore}`).join(" · ");
  return {
    riskLabel: stored.riskLevel ? assessmentRiskLabels[stored.riskLevel] : "已关联",
    summary: scoreText || "咨询师仅能看到风险等级和三项量表摘要，不会看到逐题答案。"
  };
});

function formatFullTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatFullRange(start: string, end: string) {
  const endDate = new Date(end);
  return `${formatFullTime(start)}-${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function durationMinutes(start: string, end: string) {
  return Math.max(Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000), 1);
}

async function loadSlots() {
  if (!counselorId.value) {
    error.value = "请先选择一位咨询师。";
    return;
  }
  try {
    const [profile, availableSlots] = await Promise.all([
      getCounselor(counselorId.value),
      listCounselorSlots(counselorId.value)
    ]);
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
    replacePage(`/pages/receipt/index?id=${encodeURIComponent(result.id)}`);
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
      content: `${counselorName.value || "已选咨询师"} · ${
        selectedSlot.value ? formatShortRange(selectedSlot.value.startTime, selectedSlot.value.endTime) : ""
      }\n确认后提交预约，状态会同步到我的预约。`,
      confirmText: "确认预约",
      cancelText: "再看看",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false)
    });
  });
}

function formatShortRange(start: string, end?: string) {
  const date = new Date(start);
  const startText = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endText = end ? new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return `${date.getMonth() + 1}/${date.getDate()} ${endText ? `${startText}-${endText}` : startText}`;
}

function goBack() {
  uni.navigateBack({
    fail: () => {
      replacePage(
        counselorId.value
          ? `/pages/counselor-detail/index?id=${encodeURIComponent(counselorId.value)}`
          : "/pages/counselors/index"
      );
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

.assessment-link-card {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 24rpx;
  border-radius: 30rpx;
  background: #eef6ff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.04);
  padding: 26rpx;
}

.full-confirm {
  width: 100%;
}
</style>
