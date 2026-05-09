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

    <view class="segment">
      <button class="segment-item" :class="{ 'segment-active': tab === 'active' }" @click="tab = 'active'">
        当前排期
      </button>
      <button class="segment-item" :class="{ 'segment-active': tab === 'history' }" @click="tab = 'history'">
        已删除/历史
      </button>
    </view>

    <view class="stack">
      <text v-if="error" class="error">{{ error }}</text>
      <view v-for="slot in visibleSlots" :key="slot.id" class="slot-card">
        <view class="slot-main">
          <view class="row-between">
            <text class="label-text">{{ formatDate(slot.startTime) }}</text>
            <text class="pill" :class="slot.available ? 'pill-soft' : ''">
              {{
                slot.deletedAt ? "已删除" : slot.available ? "开放中" : "已停用"
              }}
            </text>
          </view>
          <text class="copy">
            {{ formatClock(slot.startTime) }}-{{ formatClock(slot.endTime) }} ·
            {{ supportSlotModeLabels[slot.mode] }}
          </text>
          <text class="muted">
            {{ slot.location || slot.note || "地点/说明待补充" }} · 容量 {{ slot.activeCount ?? 0 }}/{{
              slot.capacity
            }}
          </text>
        </view>
        <view class="slot-actions">
          <button class="button-light compact-button" :disabled="Boolean(slot.deletedAt)" @click="openEdit(slot)">
            管理
          </button>
          <button class="button-soft compact-button" :disabled="Boolean(slot.deletedAt)" @click="toggleSlot(slot)">
            {{ slot.available ? "停用" : "启用" }}
          </button>
          <button class="button-danger compact-button" :disabled="Boolean(slot.deletedAt)" @click="deleteSlot(slot)">
            删除
          </button>
        </view>
      </view>
      <view v-if="visibleSlots.length === 0" class="card empty">
        <text class="label-text">{{ tab === "active" ? "暂未设置开放时段" : "没有已删除排期" }}</text>
        <text class="muted">
          {{ tab === "active" ? "新增后会同步到用户端咨询师详情。" : "删除后的排期会保留历史预约关联。" }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { supportSlotModeLabels, type SupportSlot } from "@teacher-support/shared";
import { deleteCounselorSlot, listCounselorOwnSlots, updateCounselorSlot } from "../../api/client";

const slots = ref<SupportSlot[]>([]);
const error = ref("");
const tab = ref<"active" | "history">("active");
const visibleSlots = computed(() =>
  tab.value === "active" ? slots.value.filter((slot) => !slot.deletedAt) : slots.value.filter((slot) => slot.deletedAt)
);

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]}`;
}

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function goBack() {
  uni.navigateBack();
}

function openCreate() {
  uni.navigateTo({ url: "/pages/counselor-slot-create/index" });
}

function openEdit(slot: SupportSlot) {
  uni.navigateTo({ url: `/pages/counselor-slot-create/index?id=${encodeURIComponent(slot.id)}` });
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

async function deleteSlot(slot: SupportSlot) {
  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "删除排期",
      content: `删除后用户端不会再展示 ${formatDate(slot.startTime)} ${formatClock(slot.startTime)}-${formatClock(
        slot.endTime
      )}，历史预约仍会保留。`,
      confirmText: "删除",
      cancelText: "再看看",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false)
    });
  });
  if (!confirmed) return;
  await deleteCounselorSlot(slot.id);
  await load();
  uni.showToast({ title: "已删除", icon: "success" });
}

onShow(load);
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

.slot-main {
  flex: 1;
  min-width: 0;
}

.slot-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  min-width: 150rpx;
}

.button-danger {
  background: #fff1f2;
  color: #e11d48;
}
</style>
