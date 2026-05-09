<template>
  <view class="page page-with-footer">
    <view class="hero">
      <text class="eyebrow">心理测评</text>
      <text class="title">用量化筛查了解近期状态</text>
      <text class="copy">基于 WHO-5、PHQ-9、GAD-7 的公开筛查框架，输出分数、等级和支持建议，不作为医学诊断。</text>
      <view class="source-strip">
        <text class="mini-tag">{{ assessmentCatalog.version }}</text>
        <text class="muted">{{ assessmentCatalog.sourceProfile }}</text>
      </view>
    </view>

    <view class="stack">
      <view class="card assessment-progress">
        <view class="row-between">
          <text class="label-text">完成进度</text>
          <text class="pill">{{ answeredCount }}/{{ totalCount }}</text>
        </view>
        <view class="progress-track">
          <view class="progress-bar" :style="{ width: `${progressPercent}%` }"></view>
        </view>
      </view>

      <view class="card stack">
        <view class="field">
          <text class="label">希望被如何称呼（可选）</text>
          <input v-model="preferredName" placeholder="可以填写昵称、代称或留空" />
        </view>
      </view>

      <view v-for="section in sections" :key="section.id" class="card stack">
        <view class="row-between">
          <view>
            <text class="label">{{ section.title }}</text>
            <text class="muted">{{ section.copy }}</text>
          </view>
          <text class="mini-tag">{{ section.range }}</text>
        </view>
        <view v-for="question in section.questions" :key="question.id" class="stack-small">
          <text class="question-text">{{ question.text }}</text>
          <view class="grid assessment-option-grid">
            <view
              v-for="option in question.options"
              :key="option.value"
              class="choice"
              :class="{ 'choice-active': answers[question.id] === option.value }"
              @click="setAnswer(question.id, option.value)"
            >
              <text>{{ option.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <text v-if="error" class="error">{{ error }}</text>
    </view>

    <view class="summary-bar">
      <view class="row-between">
        <view>
          <text class="label">筛查结果</text>
          <text class="muted">{{ allAnswered ? "已完成，可以查看结果" : `还剩 ${totalCount - answeredCount} 题` }}</text>
        </view>
        <button class="compact-button" :disabled="submitting || !allAnswered" @click="submit">
          {{ submitting ? "提交中" : "查看结果" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { assessmentCatalog, assessmentQuestions } from "@teacher-support/shared";
import { createAssessment } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";
import { replacePage } from "../../utils/navigation";
import { saveLocalReceipt } from "../../utils/receipts";

const preferredName = ref("");
const submitting = ref(false);
const error = ref("");
const answers = reactive<Record<string, number>>(
  Object.fromEntries(assessmentQuestions.map((question) => [question.id, -1]))
);
const totalCount = assessmentQuestions.length;
const answeredCount = computed(() => Object.values(answers).filter((value) => value >= 0).length);
const allAnswered = computed(() => answeredCount.value === totalCount);
const progressPercent = computed(() => Math.round((answeredCount.value / totalCount) * 100));

const sections = [
  {
    id: "who5",
    title: "整体幸福感",
    copy: "请根据最近两周的整体感受作答。",
    range: "0-25 分",
    questions: assessmentQuestions.filter((question) => question.scale === "who5")
  },
  {
    id: "phq9",
    title: "抑郁相关困扰",
    copy: "请根据最近两周出现这些状态的频率作答。",
    range: "0-27 分",
    questions: assessmentQuestions.filter((question) => question.scale === "phq9")
  },
  {
    id: "gad7",
    title: "焦虑相关困扰",
    copy: "请根据最近两周出现这些状态的频率作答。",
    range: "0-21 分",
    questions: assessmentQuestions.filter((question) => question.scale === "gad7")
  }
];

function setAnswer(questionId: string, value: number) {
  answers[questionId] = value;
}

async function submit() {
  error.value = "";
  if (!requireUserLogin("提交测评结果")) return;

  if (Object.values(answers).some((value) => value < 0)) {
    error.value = "请完成全部题目后再提交。";
    return;
  }

  submitting.value = true;
  try {
    const result = await createAssessment({
      preferredName: preferredName.value,
      answers
    });

    saveLocalReceipt({
      kind: "assessment",
      receiptCode: result.receiptCode!,
      itemId: result.id,
      title: `${preferredName.value || "匿名用户"}的心理测评`,
      createdAt: result.createdAt
    });

    replacePage(`/pages/assessment-result/index?code=${encodeURIComponent(result.receiptCode!)}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "测评暂时没有提交成功";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.assessment-progress {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.source-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 24rpx;
}

.progress-track {
  overflow: hidden;
  height: 16rpx;
  border-radius: 999rpx;
  background: #eef2ff;
}

.progress-bar {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #2563eb, #10b981);
  transition: width 0.2s ease;
}

.assessment-option-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
