<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">支持请求</text>
      <text class="title">{{ counselorName ? `向${counselorName}提交匿名请求` : "提交匿名支持请求" }}</text>
      <text class="copy">提交后会生成匿名回执码。请妥善保存，用于查看状态或撤回。</text>
    </view>

    <view class="stack">
      <view class="card">
        <text class="label">已选时间</text>
        <text v-if="loading" class="muted">正在同步时段...</text>
        <view class="stack">
          <view
            v-for="slot in slots"
            :key="slot.id"
            class="choice"
            :class="{ 'choice-active': slotId === slot.id }"
            @click="slotId = slot.id"
          >
            <text>{{ formatTime(slot.startTime) }}</text>
            <text class="muted">剩余 {{ slot.remainingCapacity }} 个位置</text>
          </view>
        </view>
      </view>

      <view class="card stack">
        <view class="field">
          <text class="label">希望被如何称呼（可选）</text>
          <input v-model="preferredName" placeholder="可以填写昵称、代称或留空" />
        </view>
        <view class="field">
          <text class="label">邮箱（可选）</text>
          <input v-model="contactEmail" placeholder="希望被联系时填写" />
        </view>
        <view class="field">
          <text class="label">其他联系方式（可选）</text>
          <input v-model="contactNote" placeholder="例如只写办公邮箱、内线或其他方式" />
        </view>
        <view class="field">
          <text class="label">补充说明（可选）</text>
          <textarea v-model="remark" maxlength="600" placeholder="可以只写你愿意表达的部分" />
        </view>
      </view>

      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="submitting" @click="submit">{{ submitting ? "提交中..." : "匿名提交" }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { SupportSlot } from "@teacher-support/shared";
import { createRequest, getCounselor, listCounselorSlots } from "../../api/client";
import { saveLocalReceipt } from "../../utils/receipts";

const slots = ref<SupportSlot[]>([]);
const counselorId = ref("");
const counselorName = ref("");
const slotId = ref("");
const preferredName = ref("");
const assessmentId = ref("");
const contactEmail = ref("");
const contactNote = ref("");
const remark = ref("");
const loading = ref(false);
const submitting = ref(false);
const error = ref("");

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

async function loadSlots() {
  if (!counselorId.value) {
    error.value = "请先选择一位咨询师。";
    return;
  }

  loading.value = true;
  try {
    const [profile, availableSlots] = await Promise.all([getCounselor(counselorId.value), listCounselorSlots(counselorId.value)]);
    counselorName.value = profile.displayName;
    slots.value = availableSlots;
    if (!slotId.value || !availableSlots.some((slot) => slot.id === slotId.value)) {
      slotId.value = availableSlots[0]?.id ?? "";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "时段暂时不可用";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  error.value = "";
  if (!counselorId.value) {
    error.value = "请先选择一位咨询师。";
    return;
  }
  if (!slotId.value) {
    error.value = "请选择一个开放时段。";
    return;
  }
  if (contactEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.value)) {
    error.value = "邮箱格式看起来不正确。";
    return;
  }

  submitting.value = true;
  try {
    const result = await createRequest({
      counselorId: counselorId.value,
      slotId: slotId.value,
      preferredName: preferredName.value,
      assessmentId: assessmentId.value,
      contactEmail: contactEmail.value,
      contactNote: contactNote.value,
      remark: remark.value
    });
    saveLocalReceipt({
      kind: "support_request",
      receiptCode: result.receiptCode,
      itemId: result.id,
      title: preferredName.value || "匿名支持请求",
      createdAt: new Date().toISOString()
    });
    uni.redirectTo({ url: `/pages/receipt/index?code=${encodeURIComponent(result.receiptCode)}` });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "提交暂时没有成功";
  } finally {
    submitting.value = false;
  }
}

const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
counselorId.value = decodeURIComponent(current?.options?.counselorId ?? "");
slotId.value = decodeURIComponent(current?.options?.slotId ?? "");
preferredName.value = decodeURIComponent(current?.options?.preferredName ?? "");
assessmentId.value = decodeURIComponent(current?.options?.assessmentId ?? "");

onMounted(loadSlots);
</script>
