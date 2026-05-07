<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">心理测评</text>
      <text class="title">用一份温和的筛查了解近期状态</text>
      <text class="copy">结果只作为状态参考和支持建议，不作为医学诊断。</text>
    </view>

    <view class="stack">
      <view class="card stack">
        <view class="field">
          <text class="label">希望被如何称呼（可选）</text>
          <input v-model="preferredName" placeholder="可以填写昵称、代称或留空" />
        </view>
      </view>

      <view v-for="section in sections" :key="section.id" class="card stack">
        <text class="label">{{ section.title }}</text>
        <text class="muted">{{ section.copy }}</text>
        <view v-for="question in section.questions" :key="question.id" class="stack-small">
          <text class="question-text">{{ question.text }}</text>
          <view class="grid">
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
      <button :disabled="submitting" @click="submit">{{ submitting ? "提交中..." : "查看筛查结果" }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { assessmentQuestions } from "@teacher-support/shared";
import { createAssessment } from "../../api/client";
import { requireUserLogin } from "../../utils/auth";
import { saveLocalReceipt } from "../../utils/receipts";

const preferredName = ref("");
const submitting = ref(false);
const error = ref("");
const answers = reactive<Record<string, number>>(
  Object.fromEntries(assessmentQuestions.map((question) => [question.id, -1]))
);

const sections = [
  {
    id: "who5",
    title: "整体幸福感",
    copy: "请根据最近两周的整体感受作答。",
    questions: assessmentQuestions.filter((question) => question.scale === "who5")
  },
  {
    id: "phq9",
    title: "抑郁相关困扰",
    copy: "请根据最近两周出现这些状态的频率作答。",
    questions: assessmentQuestions.filter((question) => question.scale === "phq9")
  },
  {
    id: "gad7",
    title: "焦虑相关困扰",
    copy: "请根据最近两周出现这些状态的频率作答。",
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

    uni.redirectTo({ url: `/pages/assessment-result/index?code=${encodeURIComponent(result.receiptCode!)}` });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "测评暂时没有提交成功";
  } finally {
    submitting.value = false;
  }
}
</script>
