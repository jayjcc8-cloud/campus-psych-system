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

      <view class="card radar-card">
        <view class="row-between">
          <view>
            <text class="label">量化雷达图</text>
            <text class="muted">分值越高，代表该维度越需要关注。</text>
          </view>
          <text class="mini-tag">0-100</text>
        </view>
        <canvas id="assessmentRadar" canvas-id="assessmentRadar" class="radar-canvas" />
        <view class="radar-legend">
          <view v-for="item in radarItems" :key="item.key" class="radar-legend-item">
            <text class="radar-dot" :style="{ background: item.color }"></text>
            <text>{{ item.label }} {{ item.value }}</text>
          </view>
        </view>
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
        <button @click="goToRequest">带着这份结果预约咨询师</button>
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
import { onLoad, onReady } from "@dcloudio/uni-app";
import { computed, nextTick, ref, watch } from "vue";
import {
  assessmentRiskLabels,
  assessmentScaleLabels,
  type AssessmentScaleScore,
  type AssessmentSummary
} from "@teacher-support/shared";
import { getAssessmentByReceipt } from "../../api/client";
import { openPage } from "../../utils/navigation";

const code = ref("");
const report = ref<AssessmentSummary | null>(null);
const error = ref("");

const riskLabel = computed(() => (report.value ? assessmentRiskLabels[report.value.riskLevel] : ""));
const radarItems = computed(() => {
  const scoreByScale = new Map(displayScores.value.map((score) => [score.scale, score]));
  const who5 = scoreByScale.get("who5");
  const phq9 = scoreByScale.get("phq9");
  const gad7 = scoreByScale.get("gad7");
  return [
    {
      key: "who5",
      label: "幸福感不足",
      value: Math.max(0, Math.min(100, 100 - (who5?.normalizedScore ?? 0))),
      color: "#10b981"
    },
    {
      key: "phq9",
      label: "抑郁相关困扰",
      value: Math.max(0, Math.min(100, phq9?.normalizedScore ?? 0)),
      color: "#f59e0b"
    },
    {
      key: "gad7",
      label: "焦虑相关困扰",
      value: Math.max(0, Math.min(100, gad7?.normalizedScore ?? 0)),
      color: "#2563eb"
    }
  ];
});
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
  if (report.value) {
    uni.setStorageSync(`assessment_summary:${report.value.id}`, {
      riskLevel: report.value.riskLevel,
      scoreSummary: report.value.scoreSummary,
      scaleVersion: report.value.scaleVersion,
      sourceProfile: report.value.sourceProfile
    });
  }
  const query = report.value
    ? `?assessmentId=${encodeURIComponent(report.value.id)}&preferredName=${encodeURIComponent(report.value.preferredName || "")}`
    : "";
  openPage(`/pages/counselors/index${query}`);
}

function drawRadar() {
  if (!report.value) return;
  const items = radarItems.value;
  const centerX = 160;
  const centerY = 130;
  const radius = 88;
  const context = uni.createCanvasContext("assessmentRadar");

  context.clearRect(0, 0, 320, 260);
  context.setLineWidth(1);
  context.setStrokeStyle("#e5e7eb");
  context.setFillStyle("#6b7280");
  context.setFontSize(11);

  [0.33, 0.66, 1].forEach((level) => {
    context.beginPath();
    items.forEach((_, index) => {
      const point = radarPoint(index, radius * level, centerX, centerY);
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.stroke();
  });

  items.forEach((item, index) => {
    const outer = radarPoint(index, radius, centerX, centerY);
    const label = radarPoint(index, radius + 28, centerX, centerY);
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(outer.x, outer.y);
    context.stroke();
    context.setFillStyle("#374151");
    context.fillText(item.label, label.x - 34, label.y + 4);
  });

  context.beginPath();
  items.forEach((item, index) => {
    const point = radarPoint(index, radius * (item.value / 100), centerX, centerY);
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.setFillStyle("rgba(37, 99, 235, 0.18)");
  context.fill();
  context.setStrokeStyle("#2563eb");
  context.setLineWidth(2);
  context.stroke();

  items.forEach((item, index) => {
    const point = radarPoint(index, radius * (item.value / 100), centerX, centerY);
    context.beginPath();
    context.setFillStyle(item.color);
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fill();
  });

  context.draw();
}

function radarPoint(index: number, targetRadius: number, centerX: number, centerY: number) {
  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 3);
  return {
    x: centerX + Math.cos(angle) * targetRadius,
    y: centerY + Math.sin(angle) * targetRadius
  };
}

onLoad((options = {}) => {
  code.value = typeof options.code === "string" ? decodeURIComponent(options.code) : "";
  void load();
});

onReady(() => {
  void nextTick(drawRadar);
});

watch(report, () => {
  void nextTick(drawRadar);
});
</script>

<style scoped>
.score-unit {
  color: #8a93a5;
  font-size: 28rpx;
  font-weight: 700;
}

.radar-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.radar-canvas {
  width: 100%;
  height: 520rpx;
  border-radius: 28rpx;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
}

.radar-legend {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.radar-legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  color: #475569;
  padding: 14rpx;
  font-size: 22rpx;
  font-weight: 760;
}

.radar-dot {
  width: 16rpx;
  height: 16rpx;
  flex: 0 0 16rpx;
  border-radius: 999rpx;
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
