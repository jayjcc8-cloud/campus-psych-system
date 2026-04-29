<template>
  <view class="page">
    <view v-if="counselor" class="hero">
      <text class="eyebrow">{{ counselor.title }}</text>
      <text class="title">{{ counselor.displayName }}</text>
      <text class="copy">{{ counselor.intro }}</text>
      <view class="tag-row">
        <text v-for="tag in counselor.specialties" :key="tag" class="mini-tag">{{ tag }}</text>
      </view>
    </view>

    <view class="stack">
      <text v-if="loading" class="muted">正在同步可选时间...</text>
      <text v-if="error" class="error">{{ error }}</text>

      <view class="card stack">
        <text class="label">开放时段</text>
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
        <text v-if="!loading && slots.length === 0" class="muted">这位咨询师暂时没有开放时段。</text>
      </view>

      <button :disabled="!counselor || !slotId" @click="startRequest">继续提交匿名请求</button>
      <button class="button-ghost" @click="goBack">返回列表</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { CounselorProfile, SupportSlot } from "@teacher-support/shared";
import { getCounselor, listCounselorSlots } from "../../api/client";

const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const counselorId = decodeURIComponent(current?.options?.id ?? "");
const assessmentId = decodeURIComponent(current?.options?.assessmentId ?? "");
const preferredName = decodeURIComponent(current?.options?.preferredName ?? "");
const counselor = ref<CounselorProfile | null>(null);
const slots = ref<SupportSlot[]>([]);
const slotId = ref("");
const loading = ref(false);
const error = ref("");

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function startRequest() {
  const query = [
    `counselorId=${encodeURIComponent(counselorId)}`,
    `slotId=${encodeURIComponent(slotId.value)}`,
    `assessmentId=${encodeURIComponent(assessmentId)}`,
    `preferredName=${encodeURIComponent(preferredName)}`
  ].join("&");
  uni.navigateTo({
    url: `/pages/request/index?${query}`
  });
}

function goBack() {
  uni.navigateBack();
}

async function load() {
  if (!counselorId) {
    error.value = "缺少咨询师信息，请返回后重新选择。";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const [profile, availableSlots] = await Promise.all([getCounselor(counselorId), listCounselorSlots(counselorId)]);
    counselor.value = profile;
    slots.value = availableSlots;
    slotId.value = availableSlots[0]?.id ?? "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "咨询师信息暂时不可用";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
