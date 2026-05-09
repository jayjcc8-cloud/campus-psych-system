<template>
  <!-- #ifdef MP-WEIXIN -->
  <view class="page">
    <view class="home-hero">
      <view>
        <wd-tag type="primary" plain round>端到端隐私保护</wd-tag>
        <text class="home-greeting">Hi，你辛苦了</text>
        <text class="home-copy">现在的状态怎么样？</text>
      </view>
      <view class="orb">
        <text class="orb-dot orb-dot-left"></text>
        <text class="orb-dot orb-dot-right"></text>
      </view>
    </view>

    <view class="mood-shell">
      <button
        v-for="item in moods"
        :key="item.label"
        class="mood-card interactive"
        :class="{ 'mood-active': selectedMood === item.label }"
        @click="selectMood(item)"
      >
        <text class="mood-icon">{{ item.icon }}</text>
        <text>{{ item.label }}</text>
      </button>
    </view>

    <button class="booking-panel interactive" @click="go('/pages/counselors/index')">
      <view>
        <text class="panel-title">预约心理咨询</text>
        <text class="panel-copy">找一个你愿意说话的时间</text>
      </view>
      <text class="panel-button">开始预约 →</text>
    </button>

    <view class="card appointment-card">
      <view class="row-between">
        <text class="card-title">你已预约</text>
        <text class="pill pill-soft">即将开始</text>
      </view>
      <view v-if="recentAppointment" class="home-appointment interactive" @click="openRecentAppointment">
        <view class="avatar avatar-small">{{ (recentAppointment.counselorName || "咨").slice(0, 1) }}</view>
        <view class="home-appointment-main">
          <text class="label-text">{{ recentAppointment.counselorName || "咨询师" }}</text>
          <text class="muted">
            {{ formatSlot(recentAppointment.slotStartTime || recentAppointment.createdAt, recentAppointment.slotEndTime) }}
          </text>
        </view>
      </view>
      <view v-else class="empty-inline">
        <text class="muted">还没有预约。你可以先浏览咨询师，再选择合适时间。</text>
      </view>
      <view class="appointment-actions">
        <button class="button-light compact-button" @click="go('/pages/requests/index')">查看详情</button>
        <button class="button-soft compact-button" @click="go('/pages/counselors/index')">预约时间</button>
      </view>
    </view>

    <view class="section-head">
      <text class="card-title">最近可约</text>
      <button class="button-ghost compact-button" @click="go('/pages/counselors/index')">查看更多 ›</button>
    </view>
    <view v-if="recentSlots.length" class="quick-slot-row">
      <button v-for="slot in recentSlots" :key="slot.id" class="quick-slot" @click="go('/pages/counselors/index')">
        {{ formatSlot(slot.startTime, slot.endTime) }}
      </button>
    </view>
    <view v-else class="card soft-card">
      <text class="muted">暂未同步到可约时段，可以先查看咨询师资料。</text>
    </view>

    <button class="assessment-banner interactive" @click="go('/pages/assessment/index')">
      <view>
        <text class="card-title">心理测评</text>
        <text class="muted">用作状态参考，不影响预约</text>
      </view>
      <text class="assessment-badge">进入</text>
    </button>

    <view class="support-note">
      <view>
        <text class="card-title">在这里，你不是一个人</text>
        <text class="muted">可以只留下你愿意表达的部分。</text>
      </view>
      <view class="leaf-mark"></view>
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";
import type { SupportRequestSummary, SupportSlot } from "@teacher-support/shared";
import { getUserToken, listSlots, listUserAppointments } from "../../api/client";
import { openPage } from "../../utils/navigation";

const selectedMood = ref("");
const recentSlots = ref<SupportSlot[]>([]);
const appointments = ref<SupportRequestSummary[]>([]);
const moods = [
  { label: "有点累", icon: "○" },
  { label: "有点乱", icon: "◔" },
  { label: "还好", icon: "✦" },
  { label: "说不上来", icon: "◌" }
];
const recentAppointment = computed(() =>
  appointments.value.find((item) => ["new", "viewed", "noted"].includes(item.status))
);

function selectMood(item: (typeof moods)[number]) {
  selectedMood.value = selectedMood.value === item.label ? "" : item.label;
}

function go(url: string) {
  openPage(url);
}

function openRecentAppointment() {
  if (!recentAppointment.value) return;
  openPage(`/pages/receipt/index?id=${encodeURIComponent(recentAppointment.value.id)}`);
}

function formatSlot(value: string, end?: string) {
  const date = new Date(value);
  const today = new Date();
  const label = date.toDateString() === today.toDateString() ? "今天" : `${date.getMonth() + 1}/${date.getDate()}`;
  const startText = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const endText = end ? new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return `${label} ${endText ? `${startText}-${endText}` : startText}`;
}

async function loadRecentSlots() {
  try {
    recentSlots.value = (await listSlots()).slice(0, 3);
  } catch {
    recentSlots.value = [];
  }
}

async function refreshAppointments() {
  if (!getUserToken()) {
    appointments.value = [];
    return;
  }
  try {
    appointments.value = await listUserAppointments();
  } catch {
    appointments.value = [];
  }
}

function syncHomeChrome() {
  // #ifdef MP-WEIXIN
  uni.showTabBar();
  // #endif
}

onMounted(() => {
  syncHomeChrome();
  void loadRecentSlots();
});
onShow(() => {
  syncHomeChrome();
  void refreshAppointments();
});
</script>

<style scoped>
.home-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 214rpx;
  padding: 38rpx 16rpx 16rpx;
}

.home-greeting,
.home-copy {
  display: block;
}

.home-greeting {
  color: #101828;
  font-size: 42rpx;
  font-weight: 900;
}

.home-copy {
  margin-top: 14rpx;
  color: #4b5563;
  font-size: 27rpx;
}

.orb {
  position: relative;
  width: 178rpx;
  height: 178rpx;
  border-radius: 70rpx;
  background:
    radial-gradient(circle at 32% 26%, rgba(255, 218, 210, 0.88), transparent 25%),
    radial-gradient(circle at 64% 65%, rgba(37, 99, 235, 0.78), transparent 44%), rgba(157, 240, 220, 0.5);
  filter: blur(1rpx);
}

.orb-dot {
  position: absolute;
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
}

.orb-dot-left {
  left: -16rpx;
  bottom: 46rpx;
  background: rgba(255, 179, 198, 0.72);
}

.orb-dot-right {
  right: -20rpx;
  bottom: 54rpx;
  background: rgba(37, 99, 235, 0.64);
}

.mood-shell {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 18rpx;
}

.mood-card {
  display: flex;
  min-height: 128rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12rpx;
  border-radius: 24rpx;
  background: #f9fafb;
  color: #3b465d;
  font-size: 23rpx;
  padding: 10rpx;
}

.mood-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 18rpx;
  background: #eff6ff;
  color: #2563eb;
  font-size: 28rpx;
  font-weight: 900;
}

.mood-active {
  background: #eff6ff;
  color: #2563eb;
}

.booking-panel {
  display: flex;
  min-height: 238rpx;
  align-items: stretch;
  justify-content: space-between;
  flex-direction: column;
  margin-top: 24rpx;
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 90% 16%, rgba(255, 255, 255, 0.18), transparent 28%),
    linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 22rpx 60rpx rgba(37, 99, 235, 0.22);
  padding: 30rpx;
  text-align: left;
}

.panel-title,
.panel-copy {
  display: block;
  color: #ffffff;
}

.panel-title {
  font-size: 36rpx;
}

.panel-copy {
  margin-top: 8rpx;
  opacity: 0.86;
  font-size: 25rpx;
}

.panel-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 78rpx;
  border-radius: 24rpx;
  background: #ffffff;
  color: #2563eb;
  font-size: 28rpx;
  font-weight: 850;
}

.appointment-card,
.assessment-banner,
.support-note {
  margin-top: 24rpx;
}

.home-appointment {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 24rpx;
}

.home-appointment-main {
  min-width: 0;
  flex: 1;
}

.appointment-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  margin-top: 24rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 34rpx 4rpx 18rpx;
}

.quick-slot-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
}

.quick-slot {
  min-height: 76rpx;
  padding: 0 12rpx;
}

.assessment-banner,
.support-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 28rpx;
}

.assessment-badge {
  border-radius: 999rpx;
  background: #eff6ff;
  color: #2563eb;
  padding: 10rpx 20rpx;
  font-size: 23rpx;
  font-weight: 800;
}

.leaf-mark {
  width: 74rpx;
  height: 92rpx;
  border-radius: 50% 0 50% 0;
  background: linear-gradient(145deg, rgba(151, 207, 190, 0.48), rgba(151, 207, 190, 0.08));
}
</style>
