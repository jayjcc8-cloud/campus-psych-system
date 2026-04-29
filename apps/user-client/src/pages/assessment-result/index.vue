<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">筛查结果</text>
      <text class="title">{{ report?.preferredName ? `${report.preferredName}的近期状态参考` : "你的近期状态参考" }}</text>
      <text class="copy">这份结果只用于帮助你理解近期状态和支持建议，不作为医学诊断。</text>
    </view>

    <view class="stack" v-if="report">
      <view class="card stack">
        <text class="pill">{{ riskLabel }}</text>
        <text class="copy">{{ primaryAdvice }}</text>
        <text v-if="report.safetyFlag" class="error">
          如果你此刻担心自己的安全，请优先联系可信赖的人，或尽快使用紧急支持资源。
        </text>
      </view>

      <view class="grid">
        <view class="card stack-small">
          <text class="label">整体幸福感</text>
          <text class="score-text">{{ report.who5Score }}</text>
          <text class="muted">{{ report.wellbeingLevel }}</text>
        </view>
        <view class="card stack-small">
          <text class="label">抑郁相关困扰</text>
          <text class="score-text">{{ report.phq9Score }}</text>
          <text class="muted">{{ report.depressionLevel }}</text>
        </view>
        <view class="card stack-small">
          <text class="label">焦虑相关困扰</text>
          <text class="score-text">{{ report.gad7Score }}</text>
          <text class="muted">{{ report.anxietyLevel }}</text>
        </view>
      </view>

      <view class="card stack">
        <text class="label">下一步建议</text>
        <text class="copy">你可以先给自己留出一点稳定的支持时间，也可以带着这份结果再提交支持请求。</text>
        <button @click="goToRequest">带着这份结果继续求助</button>
        <button class="button-soft" @click="go('/pages/emergency/index')">查看紧急支持资源</button>
        <button class="button-ghost" @click="go('/pages/requests/index')">回到我的回执</button>
      </view>
    </view>

    <view v-else class="card stack">
      <text v-if="error" class="error">{{ error }}</text>
      <text v-else class="muted">正在加载测评结果...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { assessmentRiskLabels, type AssessmentSummary } from "@teacher-support/shared";
import { getAssessmentByReceipt } from "../../api/client";

const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const code = decodeURIComponent(current?.options?.code ?? "");
const report = ref<AssessmentSummary | null>(null);
const error = ref("");

const riskLabel = computed(() => (report.value ? assessmentRiskLabels[report.value.riskLevel] : ""));
const primaryAdvice = computed(() => {
  if (!report.value) {
    return "";
  }

  if (report.value.riskLevel === "high") {
    return "近期状态提示你可能已经承受了较重的负担，建议尽快联系支持资源，不必一个人扛着。";
  }

  if (report.value.riskLevel === "medium") {
    return "近期状态提示你可能已经有一段时间在吃力地维持，值得尽早给自己安排支持。";
  }

  return "目前未提示明显高风险，但如果你仍想被支持，依然可以主动发起支持请求。";
});

async function load() {
  try {
    report.value = await getAssessmentByReceipt(code);
    if (!report.value) {
      error.value = "没有找到这份测评回执。";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "测评结果加载失败";
  }
}

function go(url: string) {
  uni.navigateTo({ url });
}

function goToRequest() {
  const query = report.value ? `?assessmentId=${encodeURIComponent(report.value.id)}&preferredName=${encodeURIComponent(report.value.preferredName || "")}` : "";
  uni.navigateTo({ url: `/pages/request/index${query}` });
}

if (code) {
  void load();
}
</script>
