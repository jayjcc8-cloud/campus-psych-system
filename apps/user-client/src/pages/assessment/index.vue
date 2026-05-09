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

      <view class="card question-card">
        <view class="row-between">
          <view>
            <text class="label">{{ currentSection.title }}</text>
            <text class="muted">{{ currentSection.copy }}</text>
          </view>
          <text class="mini-tag">{{ currentIndex + 1 }}/{{ totalCount }}</text>
        </view>
        <view class="question-stage">
          <text class="question-index">第 {{ currentIndex + 1 }} 题</text>
          <text class="question-text">{{ currentQuestion.text }}</text>
          <view class="answer-list">
            <button
              v-for="option in currentQuestion.options"
              :key="option.value"
              class="answer-option"
              :class="{ 'answer-option-active': answers[currentQuestion.id] === option.value }"
              @click="setAnswer(currentQuestion.id, option.value)"
            >
              <text>{{ option.label }}</text>
              <text class="answer-check">{{ answers[currentQuestion.id] === option.value ? "已选" : "选择" }}</text>
            </button>
          </view>
        </view>
        <view class="question-nav">
          <button class="button-light compact-button" :disabled="currentIndex === 0" @click="goPrevious">上一题</button>
          <button class="button-soft compact-button" :disabled="!canGoNext" @click="goNext">
            {{ currentIndex === totalCount - 1 ? "完成答题" : "下一题" }}
          </button>
        </view>
        <view class="question-dots">
          <button
            v-for="(question, index) in assessmentQuestions"
            :key="question.id"
            class="question-dot"
            :class="{
              'question-dot-current': index === currentIndex,
              'question-dot-answered': answers[question.id] >= 0
            }"
            @click="currentIndex = index"
          ></button>
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
import { assessmentCatalog, assessmentQuestions, type AssessmentScaleId } from "@teacher-support/shared";
import { createAssessment } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";
import { replacePage } from "../../utils/navigation";
import { saveLocalReceipt } from "../../utils/receipts";

const preferredName = ref("");
const submitting = ref(false);
const error = ref("");
const currentIndex = ref(0);
const answers = reactive<Record<string, number>>(
  Object.fromEntries(assessmentQuestions.map((question) => [question.id, -1]))
);
const totalCount = assessmentQuestions.length;
const answeredCount = computed(() => Object.values(answers).filter((value) => value >= 0).length);
const allAnswered = computed(() => answeredCount.value === totalCount);
const progressPercent = computed(() => Math.round((answeredCount.value / totalCount) * 100));
const currentQuestion = computed(() => assessmentQuestions[currentIndex.value] ?? assessmentQuestions[0]);
const currentSection = computed(() => sectionMap[currentQuestion.value.scale]);
const canGoNext = computed(() => answers[currentQuestion.value.id] >= 0);

const sectionMap: Record<AssessmentScaleId, { title: string; copy: string; range: string }> = {
  who5: {
    title: "整体幸福感",
    copy: "请根据最近两周的整体感受作答。",
    range: "0-25 分"
  },
  phq9: {
    title: "抑郁相关困扰",
    copy: "请根据最近两周出现这些状态的频率作答。",
    range: "0-27 分"
  },
  gad7: {
    title: "焦虑相关困扰",
    copy: "请根据最近两周出现这些状态的频率作答。",
    range: "0-21 分"
  }
};

function setAnswer(questionId: string, value: number) {
  answers[questionId] = value;
  const answeredIndex = currentIndex.value;
  setTimeout(() => {
    if (currentIndex.value !== answeredIndex) return;
    if (currentIndex.value < totalCount - 1) {
      currentIndex.value += 1;
    }
  }, 180);
}

function goPrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

function goNext() {
  if (!canGoNext.value) return;
  if (currentIndex.value < totalCount - 1) {
    currentIndex.value += 1;
  }
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

.question-card {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.question-stage {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  min-height: 520rpx;
}

.question-index {
  color: #2563eb;
  font-size: 24rpx;
  font-weight: 850;
}

.question-text {
  display: block;
  color: #101828;
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.42;
}

.answer-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 10rpx;
}

.answer-option {
  display: flex;
  min-height: 96rpx;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid #edf0f6;
  border-radius: 26rpx;
  background: #f8fafc;
  color: #344054;
  font-size: 28rpx;
  font-weight: 760;
  padding: 0 24rpx;
  text-align: left;
  box-shadow: none;
}

.answer-option-active {
  border-color: rgba(37, 99, 235, 0.38);
  background: #eff6ff;
  color: #2563eb;
}

.answer-check {
  color: #667085;
  font-size: 23rpx;
  font-weight: 760;
}

.answer-option-active .answer-check {
  color: #2563eb;
}

.question-nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.question-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.question-dot {
  width: 18rpx;
  height: 18rpx;
  min-height: 18rpx;
  border-radius: 999rpx;
  background: #d8dee9;
  padding: 0;
}

.question-dot-answered {
  background: #93c5fd;
}

.question-dot-current {
  width: 42rpx;
  background: #2563eb;
}
</style>
