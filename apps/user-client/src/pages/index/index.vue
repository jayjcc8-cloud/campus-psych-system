<template>
  <view class="page">
    <view class="home-hero">
      <view>
        <text class="home-greeting">Hi，今天辛苦了</text>
        <text class="home-copy">现在的状态怎么样？</text>
      </view>
      <view class="orb">
        <text class="orb-dot orb-dot-left"></text>
        <text class="orb-dot orb-dot-right"></text>
      </view>
    </view>

    <view class="grid mood-grid">
      <button
        v-for="item in moods"
        :key="item.label"
        class="mood-card interactive"
        :class="{ 'mood-card-active': selectedMood === item.label }"
        @click="selectMood(item)"
      >
        <text class="mood-icon">{{ selectedMood === item.label ? "✓" : "○" }}</text>
        <text class="mood-text">{{ item.label }}</text>
      </button>
    </view>

    <view v-if="selectedMood" class="hint-card mood-hint">
      <text class="label-text">{{ selectedMood }}</text>
      <text class="copy">{{ moodHint }}</text>
      <button class="compact-button mood-action" @click="go('/pages/counselors/index')">看看可约咨询师</button>
    </view>

    <button class="primary-panel interactive" @click="go('/pages/counselors/index')">
      <view>
        <text class="panel-title">预约心理咨询</text>
        <text class="panel-copy">找一个你愿意说话的时间</text>
      </view>
      <text class="panel-cta">开始预约 →</text>
    </button>

    <view class="card appointment-home-card">
      <view class="row-between">
        <text class="label-text">我的最近预约</text>
        <button class="button-ghost compact-button" @click="go('/pages/requests/index')">查看全部</button>
      </view>
      <view v-if="recentAppointment" class="recent-appointment interactive" @click="openRecentAppointment">
        <view class="row-between">
          <text class="pill pill-soft">待查看状态</text>
          <text class="muted">{{ formatLocalDate(recentAppointment.createdAt) }}</text>
        </view>
        <text class="label-text">{{ recentAppointment.title }}</text>
        <text class="muted">回执码：{{ recentAppointment.receiptCode }}</text>
      </view>
      <view v-else class="empty-inline">
        <text class="muted">还没有预约。你可以先浏览咨询师资料，再选择合适时间。</text>
      </view>
    </view>

    <view class="card compact-section">
      <view class="row-between">
        <text class="label-text">最近可约</text>
        <button class="button-ghost compact-button" @click="go('/pages/counselors/index')">查看更多</button>
      </view>
      <view v-if="recentSlots.length" class="quick-slot-row">
        <button v-for="slot in recentSlots" :key="slot.id" class="quick-slot" @click="go('/pages/counselors/index')">
          {{ formatSlot(slot.startTime) }}
        </button>
      </view>
      <text v-else class="muted">暂未同步到可约时段，可以先查看咨询师资料。</text>
    </view>

    <view class="card soft-card support-note">
      <view class="row-between">
        <text class="label-text">在这里，你不是一个人</text>
        <text class="pill pill-soft">匿名优先</text>
      </view>
      <text class="copy">你可以只留下自己愿意表达的部分。预约信息仅用于本次支持，我们会尽量保护你的隐私。</text>
    </view>

    <view class="secondary-entry-list">
      <button class="secondary-entry interactive" @click="go('/pages/assessment/index')">
        <view>
          <text class="secondary-entry-title">心理测评</text>
          <text class="secondary-entry-copy">作为状态参考，不影响预约</text>
        </view>
        <text class="chevron">›</text>
      </button>
      <button class="secondary-entry interactive" @click="go('/pages/privacy/index')">
        <view>
          <text class="secondary-entry-title">隐私说明</text>
          <text class="secondary-entry-copy">了解数据边界</text>
        </view>
        <text class="chevron">›</text>
      </button>
      <button class="secondary-entry interactive" @click="go('/pages/emergency/index')">
        <view>
          <text class="secondary-entry-title">紧急支持</text>
          <text class="secondary-entry-copy">需要立即帮助时查看</text>
        </view>
        <text class="chevron">›</text>
      </button>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";
import type { SupportSlot } from "@teacher-support/shared";
import { listSlots } from "../../api/client";
import { openPage } from "../../utils/navigation";
import { listLocalReceipts, type LocalReceipt } from "../../utils/receipts";

const selectedMood = ref("");
const recentSlots = ref<SupportSlot[]>([]);
const receipts = ref<LocalReceipt[]>([]);
const moods = [
  { label: "有点累", hint: "可以先选一个时间，不需要现在把所有话都整理好。" },
  { label: "有点乱", hint: "如果现在难以整理语言，可以先预约，补充说明留空也可以。" },
  { label: "还好", hint: "可以把这里当作一个安静的备选入口，需要时再回来。" },
  { label: "说不上来", hint: "说不上来本身也值得被接住。你可以不分类、不解释，先选一个时间。" }
];
const moodHint = computed(() => moods.find((item) => item.label === selectedMood.value)?.hint ?? "");
const recentAppointment = computed(() => receipts.value.find((item) => item.kind === "support_request"));

function selectMood(item: (typeof moods)[number]) {
  selectedMood.value = selectedMood.value === item.label ? "" : item.label;
}

function go(url: string) {
  openPage(url);
}

function openRecentAppointment() {
  if (!recentAppointment.value) return;
  openPage(`/pages/lookup/index?code=${encodeURIComponent(recentAppointment.value.receiptCode)}`);
}

function formatSlot(value: string) {
  const date = new Date(value);
  const today = new Date();
  const label = date.toDateString() === today.toDateString() ? "今天" : `${date.getMonth() + 1}/${date.getDate()}`;
  return `${label} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatLocalDate(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

async function loadRecentSlots() {
  try {
    recentSlots.value = (await listSlots()).slice(0, 3);
  } catch {
    recentSlots.value = [];
  }
}

function refreshReceipts() {
  receipts.value = listLocalReceipts();
}

onMounted(loadRecentSlots);
onShow(refreshReceipts);
</script>

<style scoped>
.home-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 210rpx;
  padding: 36rpx 18rpx 16rpx;
}

.home-greeting,
.home-copy {
  display: block;
}

.home-greeting {
  color: #101828;
  font-size: 42rpx;
  font-weight: 850;
  line-height: 1.2;
}

.home-copy {
  margin-top: 14rpx;
  color: #667085;
  font-size: 27rpx;
}

.orb {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  border-radius: 72rpx;
  background:
    radial-gradient(circle at 38% 26%, rgba(255, 222, 216, 0.9), transparent 24%),
    radial-gradient(circle at 66% 62%, rgba(96, 112, 255, 0.78), transparent 43%),
    rgba(158, 240, 221, 0.5);
  filter: blur(1rpx);
}

.orb-dot {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
}

.orb-dot-left {
  left: -18rpx;
  bottom: 44rpx;
  background: rgba(255, 179, 198, 0.72);
}

.orb-dot-right {
  right: -20rpx;
  bottom: 52rpx;
  background: rgba(96, 112, 255, 0.64);
}

.mood-grid {
  margin-top: 24rpx;
}

.mood-card,
.action-card {
  box-sizing: border-box;
  min-height: auto;
  border: 0;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #162033;
  box-shadow: 0 18rpx 48rpx rgba(28, 38, 70, 0.07);
  padding: 24rpx;
  line-height: 1.2;
  text-align: left;
}

.mood-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 138rpx;
  flex-direction: column;
  gap: 14rpx;
  text-align: center;
}

.mood-card-active {
  background: #f5f6ff;
  box-shadow: inset 0 0 0 2rpx rgba(102, 119, 255, 0.35);
}

.mood-icon,
.action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50rpx;
  height: 50rpx;
  border-radius: 18rpx;
  background: #eef2ff;
  color: #6677ff;
  font-weight: 850;
}

.mood-text {
  color: #475467;
  font-size: 25rpx;
  font-weight: 700;
}

.mood-hint {
  margin-top: 20rpx;
}

.mood-action {
  margin-top: 18rpx;
}

.primary-panel {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 28rpx;
  width: 100%;
  min-height: auto;
  margin-top: 24rpx;
  border: 0;
  border-radius: 34rpx;
  background: linear-gradient(135deg, #707cff, #6f7df6);
  box-shadow: 0 28rpx 70rpx rgba(102, 119, 255, 0.25);
  padding: 34rpx;
  color: #ffffff;
  line-height: 1.2;
  text-align: left;
}

.panel-title,
.panel-copy {
  display: block;
}

.panel-title {
  font-size: 34rpx;
  font-weight: 850;
}

.panel-copy {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 25rpx;
}

.panel-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 76rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #263a59;
  font-size: 28rpx;
  font-weight: 850;
}

.compact-section,
.support-note {
  margin-top: 24rpx;
}

.appointment-home-card {
  margin-top: 24rpx;
}

.recent-appointment {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 22rpx;
  border-radius: 28rpx;
  background: #f7f8ff;
  padding: 22rpx;
}

.empty-inline {
  margin-top: 18rpx;
  border-radius: 26rpx;
  background: #f7f8ff;
  padding: 22rpx;
}

.quick-slot-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 20rpx;
}

.quick-slot {
  min-height: 74rpx;
  border-radius: 24rpx;
  background: #f5f7fb;
  color: #344054;
  font-size: 24rpx;
  padding: 14rpx 10rpx;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.secondary-entry-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 24rpx;
}

.secondary-entry {
  display: flex;
  min-height: auto;
  align-items: center;
  justify-content: space-between;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.72);
  color: #162033;
  box-shadow: none;
  padding: 24rpx 26rpx;
  text-align: left;
}

.secondary-entry-title,
.secondary-entry-copy {
  display: block;
}

.secondary-entry-title {
  color: #263a59;
  font-size: 28rpx;
  font-weight: 820;
}

.secondary-entry-copy {
  color: #8a94a8;
  font-size: 23rpx;
}
</style>
