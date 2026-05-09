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
        <text class="muted">量表版本：{{ report.scaleVersion }} · {{ report.sourceProfile }}</text>
        <text v-if="report.safetyFlag" class="error">
          如果你此刻担心自己的安全，请优先联系可信赖的人，或尽快使用紧急支持资源。
        </text>
      </view>

      <view class="grid">
        <view v-for="score in displayScores" :key="score.scale" class="card stack-small">
          <view class="row-between">
            <text class="label">{{ score.label }}</text>
            <text class="mini-tag">{{ score.bandLabel }}</text>
          </view>
          <text class="score-text">{{ score.rawScore }}<text class="score-unit">/{{ score.maxScore }}</text></text>
          <text class="muted">标准化 {{ score.normalizedScore }}/100</text>
          <view class="score-bar">
            <view class="score-fill" :class="`score-${score.scale}`" :style="{ width: `${score.normalizedScore}%` }" />
          </view>
          <text class="muted">{{ score.interpretation }}</text>
        </view>
      </view>

      <view class="card stack">
        <text class="label">下一步建议</text>
        <view v-for="item in resultRecommendations" :key="item" class="recommendation-item">
          <text>{{ item }}</text>
        </view>
        <button @click="goToRequest">带着这份结果继续求助</button>
        <button class="button-soft" @click="go('/pages/emergency/index')">查看紧急支持资源</button>
        <button class="button-ghost" @click="go('/pages/requests/index')">回到我的</button>
      </view>
    </view>

    <view v-else class="card stack">
      <text v-if="error" class="error">{{ error }}</text>
      <text v-else class="muted">正在加载测评结果...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { assessmentRiskLabels, assessmentScaleLabels, type AssessmentScaleScore, type AssessmentSummary } from "@teacher-support/shared";
import { getAssessmentByReceipt } from "../../api/client";
import { openPage } from "../../utils/navigation";

const code = ref("");
const report = ref<AssessmentSummary | null>(null);
const error = ref("");

const riskLabel = computed(() => (report.value ? assessmentRiskLabels[report.value.riskLevel] : ""));
const displayScores = computed<AssessmentScaleScore[]>(() => {
  if (!report.value) {
    return [];
  }

  if (report.value.scoreSummary?.length) {
    return report.value.scoreSummary;
  }

  return [
    {
      scale: "who5",
      label: assessmentScaleLabels.who5,
      rawScore: Math.round(report.value.who5Score / 4),
      normalizedScore: report.value.who5Score,
      maxScore: 25,
      bandKey: "legacy",
      bandLabel: "参考",
      interpretation: report.value.wellbeingLevel,
      recommendation: "建议结合近期状态持续观察。"
    },
    {
      scale: "phq9",
      label: assessmentScaleLabels.phq9,
      rawScore: report.value.phq9Score,
      normalizedScore: Math.round((report.value.phq9Score / 27) * 100),
      maxScore: 27,
      bandKey: "legacy",
      bandLabel: "参考",
      interpretation: report.value.depressionLevel,
      recommendation: "如困扰持续，建议预约支持。"
    },
    {
      scale: "gad7",
      label: assessmentScaleLabels.gad7,
      rawScore: report.value.gad7Score,
      normalizedScore: Math.round((report.value.gad7Score / 21) * 100),
      maxScore: 21,
      bandKey: "legacy",
      bandLabel: "参考",
      interpretation: report.value.anxietyLevel,
      recommendation: "如紧张和担心持续影响日常，建议主动获得支持。"
    }
  ];
});
const resultRecommendations = computed(() => {
  if (report.value?.recommendations?.length) {
    return report.value.recommendations;
  }

  return ["你可以先给自己留出一点稳定的支持时间，也可以带着这份结果预约咨询师。", "本结果是筛查参考，不作为医学诊断。"];
});
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

  return "目前未提示明显高风险，但如果你仍想被支持，依然可以主动预约咨询师。";
});

async function load() {
  if (!code.value) {
    error.value = "缺少测评回执码。";
    return;
  }

  try {
    report.value = await getAssessmentByReceipt(code.value);
    if (!report.value) {
      error.value = "没有找到这份测评回执。";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "测评结果加载失败";
  }
}

function go(url: string) {
  openPage(url);
}

function goToRequest() {
  const query = report.value ? `?assessmentId=${encodeURIComponent(report.value.id)}&preferredName=${encodeURIComponent(report.value.preferredName || "")}` : "";
  openPage(`/pages/counselors/index${query}`);
}

onLoad((options = {}) => {
  code.value = typeof options.code === "string" ? decodeURIComponent(options.code) : "";
  void load();
});
</script>

<style scoped>
.score-unit {
  color: #8a93a5;
  font-size: 28rpx;
  font-weight: 700;
}

.score-bar {
  overflow: hidden;
  height: 18rpx;
  border-radius: 999rpx;
  background: #eef1f6;
}

.score-fill {
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}

.score-who5 {
  background: #10b981;
}

.score-phq9 {
  background: #f59e0b;
}

.score-gad7 {
  background: #2563eb;
}

.recommendation-item {
  border-radius: 22rpx;
  background: #f7f9ff;
  color: #344054;
  padding: 22rpx;
  font-size: 25rpx;
  line-height: 1.6;
}
</style>
