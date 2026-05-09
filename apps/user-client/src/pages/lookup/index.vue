<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">回执查询</text>
      <text class="title">查看预约状态</text>
      <text class="copy">状态只用于让你了解预约进展，不是对你的要求。</text>
    </view>
    <view class="card stack">
      <input v-model="receiptCode" placeholder="输入预约回执码" />
      <button @click="lookup">查询</button>
      <text v-if="error" class="error">{{ error }}</text>
    </view>
    <view v-if="request" class="card stack">
      <text class="pill">{{ statusLabel }}</text>
      <text class="title">{{ request.preferredName || "预约记录" }}</text>
      <text class="muted">{{ new Date(request.slotStartTime || request.createdAt).toLocaleString() }}</text>
      <text v-if="request.assessmentRiskLevel" class="muted">关联测评：{{ assessmentRiskLabel }}</text>
      <text class="copy">{{ request.remark || "未填写补充说明" }}</text>
      <button v-if="canWithdraw" class="button-soft" @click="withdraw">撤回预约</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { assessmentRiskLabels, requestStatusLabels, type SupportRequestSummary } from "@teacher-support/shared";
import { getRequestByReceipt, withdrawRequest } from "../../api/client";

const receiptCode = ref("");
const request = ref<SupportRequestSummary | null>(null);
const error = ref("");

const statusLabel = computed(() => (request.value ? requestStatusLabels[request.value.status] : ""));
const assessmentRiskLabel = computed(() =>
  request.value?.assessmentRiskLevel ? assessmentRiskLabels[request.value.assessmentRiskLevel] : ""
);
const canWithdraw = computed(() => request.value && ["new", "viewed", "noted"].includes(request.value.status));

async function lookup() {
  error.value = "";
  try {
    request.value = await getRequestByReceipt(receiptCode.value);
    if (!request.value) {
      error.value = "没有找到这个回执码。";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "查询失败";
  }
}

async function withdraw() {
  request.value = await withdrawRequest(receiptCode.value);
  uni.showToast({ title: "已撤回", icon: "success" });
}

onLoad((options = {}) => {
  receiptCode.value = typeof options.code === "string" ? decodeURIComponent(options.code) : "";
  if (receiptCode.value) {
    void lookup();
  }
});
</script>
