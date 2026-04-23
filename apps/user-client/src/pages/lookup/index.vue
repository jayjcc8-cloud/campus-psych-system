<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">回执查询</text>
      <text class="title">查看请求状态</text>
      <text class="copy">状态只用于让你知道中心是否已查看，不是对你的要求。</text>
    </view>
    <view class="card stack">
      <input v-model="receiptCode" placeholder="输入匿名回执码" />
      <button @click="lookup">查询</button>
      <text v-if="error" class="error">{{ error }}</text>
    </view>
    <view v-if="request" class="card stack">
      <text class="pill">{{ statusLabel }}</text>
      <text class="title">{{ issueLabel }}</text>
      <text class="muted">{{ new Date(request.slotStartTime || request.createdAt).toLocaleString() }}</text>
      <text class="copy">{{ request.remark || "未填写补充说明" }}</text>
      <button v-if="canWithdraw" class="button-soft" @click="withdraw">撤回请求</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { issueTypeLabels, requestStatusLabels, type SupportRequestSummary } from "@teacher-support/shared";
import { getRequestByReceipt, withdrawRequest } from "../../api/client";

const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const receiptCode = ref(decodeURIComponent(current?.options?.code ?? ""));
const request = ref<SupportRequestSummary | null>(null);
const error = ref("");

const statusLabel = computed(() => (request.value ? requestStatusLabels[request.value.status] : ""));
const issueLabel = computed(() => (request.value ? issueTypeLabels[request.value.issueType] : ""));
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

if (receiptCode.value) {
  void lookup();
}
</script>
