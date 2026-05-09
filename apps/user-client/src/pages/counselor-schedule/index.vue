<template>
  <view class="page">
    <view class="top-nav">
      <text class="back-link" @click="goBack">‹</text>
      <view class="top-title">
        <text class="page-title compact-title">排期管理</text>
        <text class="muted">维护开放时段与容量</text>
      </view>
    </view>

    <view class="card interactive row-between" @click="openCreate">
      <view>
        <text class="label-text">新增开放时段</text>
        <text class="muted">设置一个可被预约的时间段</text>
      </view>
      <text class="chevron">＋</text>
    </view>

    <view class="stack">
      <text v-if="error" class="error">{{ error }}</text>
      <view v-for="slot in slots" :key="slot.id" class="slot-card">
        <view>
          <text class="label-text">{{ formatTime(slot.startTime) }}</text>
          <text class="muted">至 {{ formatTime(slot.endTime) }} · 容量 {{ slot.activeCount ?? 0 }}/{{ slot.capacity }}</text>
        </view>
        <button class="button-light compact-button" @click="toggleSlot(slot)">{{ slot.available ? "停用" : "启用" }}</button>
      </view>
      <view v-if="slots.length === 0" class="card empty">
        <text class="label-text">暂未设置开放时段</text>
        <text class="muted">新增后会同步到用户端咨询师详情。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { SupportSlot } from "@teacher-support/shared";
import { listCounselorOwnSlots, updateCounselorSlot } from "../../api/client";

const slots = ref<SupportSlot[]>([]);
const error = ref("");

function formatTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function goBack() {
  uni.navigateBack();
}

function openCreate() {
  uni.navigateTo({ url: "/pages/counselor-slot-create/index" });
}

async function load() {
  error.value = "";
  try {
    slots.value = await listCounselorOwnSlots();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "排期加载失败";
  }
}

async function toggleSlot(slot: SupportSlot) {
  await updateCounselorSlot(slot.id, { available: !slot.available });
  await load();
}

onMounted(load);
</script>

<style scoped>
.slot-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 28rpx;
}
</style>
