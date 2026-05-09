<template>
  <!-- #ifdef H5 -->
  <view class="h5-landing">
    <view class="h5-site-header">
      <view class="h5-brand">
        <text class="h5-brand-mark">心</text>
        <text>心理支持预约</text>
      </view>
      <view class="h5-nav">
        <button class="h5-link-button" @click="go('/pages/assessment/index')">心理测评</button>
        <button class="h5-link-button" @click="go('/pages/privacy/index')">隐私说明</button>
        <button @click="goAccountEntry">{{ accountEntryText }}</button>
      </view>
    </view>

    <view class="h5-container h5-hero-grid">
      <view class="h5-hero-copy">
        <wd-tag type="primary" plain round>Privacy protocols active</wd-tag>
        <text class="h5-landing-title">把心理支持预约，变成更轻的一步</text>
        <text class="h5-landing-copy">面向用户和咨询师的预约与支持平台。用户可以先了解、再选择、再预约；咨询师维护排期与预约；后台只做数据看板与审计。</text>
        <view class="h5-cta-row">
          <button @click="go('/pages/counselors/index')">开始预约</button>
          <button class="button-soft" @click="go('/pages/assessment/index')">先做测评</button>
        </view>
      </view>

      <view class="h5-phone-preview h5-shell-card">
        <view class="home-hero">
          <view>
            <text class="home-greeting">Hi，你辛苦了</text>
            <text class="home-copy">现在的状态怎么样？</text>
          </view>
          <view class="orb">
            <text class="orb-dot orb-dot-left"></text>
            <text class="orb-dot orb-dot-right"></text>
          </view>
        </view>
        <button class="booking-panel interactive" @click="go('/pages/counselors/index')">
          <view>
            <text class="panel-title">预约心理咨询</text>
            <text class="panel-copy">找一个你愿意说话的时间</text>
          </view>
          <text class="panel-button">开始预约 →</text>
        </button>
      </view>
    </view>

    <view class="h5-container h5-section-grid">
      <view class="h5-feature-card">
        <text class="card-title">低负担预约</text>
        <text class="muted">先看咨询师，再选时间，最后确认提交，过程清楚可回退。</text>
      </view>
      <view class="h5-feature-card">
        <text class="card-title">心理测评入口</text>
        <text class="muted">测评只作为状态参考，不替代医学诊断，也不影响预约。</text>
      </view>
      <view class="h5-feature-card">
        <text class="card-title">隐私友好</text>
        <text class="muted">支持可选称呼、可选联系方式，回执用于查看状态。</text>
      </view>
    </view>

    <view class="h5-container h5-two-column">
      <view class="h5-shell-card h5-action-panel">
        <text class="card-title">最近可约</text>
        <view v-if="recentSlots.length" class="quick-slot-row">
          <button v-for="slot in recentSlots" :key="slot.id" class="quick-slot" @click="go('/pages/counselors/index')">
            {{ formatSlot(slot.startTime) }}
          </button>
        </view>
        <text v-else class="muted">暂未同步到可约时段，可以先查看咨询师资料。</text>
      </view>
      <view class="h5-shell-card h5-action-panel">
        <text class="card-title">继续你的预约</text>
        <text class="muted">{{ recentAppointment ? `已有回执 ${recentAppointment.receiptCode}` : "还没有本机预约回执。" }}</text>
        <button class="button-light" @click="go('/pages/requests/index')">查看我的预约</button>
      </view>
    </view>
  </view>
  <!-- #endif -->

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
        <view class="avatar avatar-small">{{ recentAppointment.title.slice(0, 1) }}</view>
        <view class="home-appointment-main">
          <text class="label-text">{{ recentAppointment.title }}</text>
          <text class="muted">回执码 {{ recentAppointment.receiptCode }}</text>
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
        {{ formatSlot(slot.startTime) }}
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
import type { SupportSlot } from "@teacher-support/shared";
import { getCounselorToken, getUserToken, listSlots } from "../../api/client";
import { openPage } from "../../utils/navigation";
import { listLocalReceipts, type LocalReceipt } from "../../utils/receipts";

const selectedMood = ref("");
const recentSlots = ref<SupportSlot[]>([]);
const receipts = ref<LocalReceipt[]>([]);
const accountEntryText = ref("登录");
const moods = [
  { label: "有点累", icon: "○" },
  { label: "有点乱", icon: "◔" },
  { label: "还好", icon: "✦" },
  { label: "说不上来", icon: "◌" }
];
const recentAppointment = computed(() => receipts.value.find((item) => item.kind === "support_request"));

function selectMood(item: (typeof moods)[number]) {
  selectedMood.value = selectedMood.value === item.label ? "" : item.label;
}

function go(url: string) {
  openPage(url);
}

function goAccountEntry() {
  if (getCounselorToken()) {
    openPage("/pages/counselor-workspace/index");
    return;
  }

  if (getUserToken()) {
    openPage("/pages/profile/index");
    return;
  }

  openPage("/pages/login/index");
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

function refreshAccountEntry() {
  if (getCounselorToken()) {
    accountEntryText.value = "咨询师端";
    return;
  }

  accountEntryText.value = getUserToken() ? "我的" : "登录";
}

function syncHomeChrome() {
  // #ifdef H5
  uni.hideTabBar();
  // #endif

  // #ifdef MP-WEIXIN
  uni.showTabBar();
  // #endif
}

onMounted(() => {
  syncHomeChrome();
  refreshAccountEntry();
  void loadRecentSlots();
});
onShow(() => {
  syncHomeChrome();
  refreshAccountEntry();
  refreshReceipts();
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
    radial-gradient(circle at 64% 65%, rgba(37, 99, 235, 0.78), transparent 44%),
    rgba(157, 240, 220, 0.5);
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

/* #ifdef H5 */
.h5-landing {
  min-height: 100vh;
  padding-bottom: 72px;
}

.h5-hero-grid {
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1.05fr) 420px;
  gap: 56px;
  padding: 34px 0 54px;
}

.h5-hero-copy {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.h5-landing-title {
  display: block;
  max-width: 720px;
  color: #101828;
  font-size: 64px;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.04;
}

.h5-landing-copy {
  display: block;
  max-width: 640px;
  color: #667085;
  font-size: 18px;
  line-height: 1.8;
}

.h5-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.h5-cta-row button,
.h5-action-panel button {
  min-height: 48px;
  border-radius: 16px;
  padding: 12px 22px;
  font-size: 15px;
}

.h5-phone-preview {
  overflow: hidden;
  min-height: 620px;
  padding: 22px;
}

.h5-phone-preview .home-hero {
  padding-top: 20px;
}

.h5-section-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.h5-feature-card,
.h5-action-panel {
  border: 1px solid rgba(218, 224, 238, 0.9);
  border-radius: 26px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(31, 41, 55, 0.06);
  padding: 26px;
}

.h5-two-column {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 22px;
}

.h5-action-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 900px) {
  .h5-hero-grid,
  .h5-section-grid,
  .h5-two-column {
    grid-template-columns: 1fr;
  }

  .h5-landing-title {
    font-size: 42px;
  }

  .h5-phone-preview {
    min-height: auto;
  }
}
/* #endif */
</style>
