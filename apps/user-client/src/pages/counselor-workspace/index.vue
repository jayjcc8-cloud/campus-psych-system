<template>
  <view class="page counselor-page">
    <view v-if="tab !== 'overview'" class="hero hero-compact counselor-section-hero">
      <text class="eyebrow">咨询师端</text>
      <text class="title">{{ sectionTitle }}</text>
      <text class="copy">{{ sectionCopy }}</text>
    </view>

    <view v-if="tab === 'overview'" class="overview-content">
      <view class="hero">
        <text class="eyebrow">咨询师端</text>
        <text class="title">{{ profile?.displayName || "我的支持工作" }}</text>
        <text class="copy">查看匿名请求、维护开放时段，并同步你在用户端展示的公开资料。</text>
      </view>
      <view class="overview-board">
        <view class="row-between">
          <text class="label-text">今日概览</text>
          <text class="pill pill-soft">{{ pendingRequests.length ? "需要留意" : "平稳" }}</text>
        </view>
        <view class="board-stats">
          <view class="board-stat interactive" @click="openRequests('active')">
            <text class="board-value">{{ pendingRequests.length }}</text>
            <text class="muted">待处理</text>
          </view>
          <view class="board-stat interactive" @click="openRequests('today')">
            <text class="board-value">{{ todayRequests.length }}</text>
            <text class="muted">今日相关</text>
          </view>
          <view class="board-stat interactive" @click="openCounselorPage('schedule')">
            <text class="board-value">{{ activeSlots.length }}</text>
            <text class="muted">开放时段</text>
          </view>
        </view>
        <text class="copy">
          {{ pendingRequests.length ? `还有 ${pendingRequests.length} 条匿名请求等待处理。` : "当前没有新的匿名请求。" }}
        </text>
        <button class="button-soft compact-button board-action" @click="openRequests('active')">查看请求队列</button>
      </view>

      <view class="grid">
        <view class="action-card interactive" @click="openCounselorPage('schedule')">
          <text class="action-icon">＋</text>
          <text class="label-text">排期管理</text>
          <text class="muted">开放时段与容量</text>
        </view>
        <view class="action-card interactive" @click="openCounselorPage('profile')">
          <text class="action-icon">✎</text>
          <text class="label-text">公开资料</text>
          <text class="muted">简介和标签</text>
        </view>
      </view>

      <view class="card stack-small">
        <view class="row-between">
          <text class="label-text">最近请求</text>
          <button class="button-light compact-button" @click="openRequests('all')">全部</button>
        </view>
        <view v-for="item in requests.slice(0, 2)" :key="item.id" class="mini-request">
          <view class="row-between">
            <text class="label">{{ item.preferredName || "匿名用户" }}</text>
            <text class="pill">{{ statusLabel(item.status) }}</text>
          </view>
          <text class="muted">{{ formatTime(item.slotStartTime || item.createdAt) }}</text>
        </view>
        <text v-if="requests.length === 0" class="muted">暂无匿名请求。</text>
      </view>
    </view>

    <view v-if="tab === 'requests'" class="stack">
      <view class="segment">
        <button class="segment-item" :class="{ 'segment-active': requestFilter === 'active' }" @click="requestFilter = 'active'">
          待处理 {{ activeRequestCount }}
        </button>
        <button class="segment-item" :class="{ 'segment-active': requestFilter === 'today' }" @click="requestFilter = 'today'">今日 {{ todayRequests.length }}</button>
        <button class="segment-item" :class="{ 'segment-active': requestFilter === 'all' }" @click="requestFilter = 'all'">全部 {{ requests.length }}</button>
      </view>

      <view v-for="item in visibleRequests" :key="item.id" class="request-card interactive" @click="toggleRequest(item.id)">
        <view class="row-between">
          <view class="row-start">
            <view class="avatar avatar-small">{{ (item.preferredName || "匿").slice(0, 1) }}</view>
            <view>
              <text class="label-text">{{ item.preferredName || "匿名用户" }}</text>
              <text class="muted">{{ formatTime(item.slotStartTime || item.createdAt) }}</text>
            </view>
          </view>
          <text class="pill" :class="item.status === 'closed' ? '' : 'pill-soft'">{{ statusLabel(item.status) }}</text>
        </view>

        <view class="meta-line">
          <text v-if="item.assessmentRiskLevel" class="mini-tag">{{ riskLabel(item.assessmentRiskLevel) }}</text>
          <text class="mini-tag">{{ item.remark ? "有说明" : "无补充" }}</text>
          <text class="mini-tag">{{ item.contactEmail || item.contactNote ? "有联系方式" : "无联系方式" }}</text>
        </view>

        <view v-if="expandedRequestId === item.id" class="request-detail">
          <text v-if="item.assessmentRiskLevel" class="risk-line">测评参考：{{ riskLabel(item.assessmentRiskLevel) }}</text>
          <text class="copy">{{ item.remark || "未填写补充说明" }}</text>
          <text v-if="item.contactEmail || item.contactNote" class="muted">
            联系方式：{{ item.contactEmail || item.contactNote }}
          </text>
        </view>

        <view class="grid-3 request-actions">
          <button class="button-light compact-button" :disabled="item.status !== 'new'" @click.stop="updateRequest(item.id, 'viewed')">已查看</button>
          <button class="button-soft compact-button" :disabled="item.status === 'noted' || item.status === 'closed'" @click.stop="updateRequest(item.id, 'noted')">已留意</button>
          <button class="compact-button" :disabled="item.status === 'closed'" @click.stop="updateRequest(item.id, 'closed')">结束</button>
        </view>
      </view>

      <view v-if="visibleRequests.length === 0" class="card empty">
        <text class="label-text">没有符合条件的请求</text>
        <text class="muted">新的匿名请求会出现在这里。</text>
      </view>
    </view>

    <view v-if="tab === 'schedule'" class="stack">
      <view class="card schedule-summary interactive" @click="openSecondaryPage('/pages/counselor-slot-create/index')">
        <view>
          <text class="label-text">新增开放时段</text>
          <text class="muted">设置一个可被预约的时间段</text>
        </view>
        <text class="chevron">＋</text>
      </view>

      <view class="card stack-small">
        <text class="label-text">我的开放时段</text>
        <view v-for="slot in slots" :key="slot.id" class="slot-row">
          <view>
            <text class="label">{{ formatTime(slot.startTime) }}</text>
            <text class="muted">至 {{ formatTime(slot.endTime) }} · 剩余 {{ slot.remainingCapacity ?? "-" }}</text>
          </view>
          <button class="button-light compact-button" @click="toggleSlot(slot)">{{ slot.available ? "停用" : "启用" }}</button>
        </view>
        <text v-if="slots.length === 0" class="muted">暂未设置开放时段。</text>
      </view>
    </view>

    <view v-if="tab === 'profile'" class="stack">
      <view class="profile-panel">
        <view class="avatar">{{ profile?.displayName?.slice(0, 1) || "咨" }}</view>
        <text class="profile-name">{{ profile?.displayName || "咨询师" }}</text>
        <text class="muted">{{ profile?.title || "心理支持" }}</text>
        <view class="tag-line">
          <text v-for="tag in profile?.specialties || []" :key="tag" class="mini-tag">{{ tag }}</text>
        </view>
      </view>

      <view class="settings-list">
        <view class="settings-cell interactive" @click="openSecondaryPage('/pages/counselor-profile-edit/index')">
          <view>
            <text class="label-text">公开资料</text>
            <text class="muted">编辑用户端展示的简介和标签</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view class="settings-cell interactive" @click="openSecondaryPage('/pages/counselor-account/index')">
          <view>
            <text class="label-text">账号与安全</text>
            <text class="muted">查看登录状态或退出账号</text>
          </view>
          <text class="chevron">›</text>
        </view>
      </view>
    </view>

    <text v-if="error" class="error">{{ error }}</text>

    <view class="counselor-bottom-nav">
      <button class="bottom-nav-item" :class="{ 'bottom-nav-active': tab === 'overview' || tab === 'schedule' }" @click="openCounselorPage('overview')">
        <text class="bottom-nav-icon">⌂</text>
        <text>工作台</text>
      </button>
      <button class="bottom-nav-item" :class="{ 'bottom-nav-active': tab === 'requests' }" @click="openCounselorPage('requests')">
        <text class="bottom-nav-icon">☷</text>
        <text>请求</text>
      </button>
      <button class="bottom-nav-item" :class="{ 'bottom-nav-active': tab === 'profile' }" @click="openCounselorPage('profile')">
        <text class="bottom-nav-icon">○</text>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { AssessmentRiskLevel, CounselorProfile, SupportRequestStatus, SupportRequestSummary, SupportSlot } from "@teacher-support/shared";
import {
  ApiError,
  clearCounselorToken,
  getCounselorMe,
  getCounselorToken,
  listCounselorOwnSlots,
  listCounselorRequests,
  updateCounselorRequest,
  updateCounselorSlot
} from "../../api/client";

type TabKey = "overview" | "requests" | "schedule" | "profile";
type RequestFilter = "active" | "all" | "today";

const props = withDefaults(defineProps<{ initialTab?: TabKey }>(), {
  initialTab: "overview"
});
const validTabs: TabKey[] = ["overview", "requests", "schedule", "profile"];
const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const initialFilter = decodeURIComponent(current?.options?.filter ?? "") as RequestFilter;
const profile = ref<CounselorProfile | null>(null);
const slots = ref<SupportSlot[]>([]);
const requests = ref<SupportRequestSummary[]>([]);
const error = ref("");
const tab = ref<TabKey>(validTabs.includes(props.initialTab) ? props.initialTab : "overview");
const requestFilter = ref<RequestFilter>(["active", "all", "today"].includes(initialFilter) ? initialFilter : "active");
const expandedRequestId = ref("");

const pendingRequests = computed(() => requests.value.filter((item) => ["new", "viewed"].includes(item.status)));
const activeRequestCount = computed(() => requests.value.filter((item) => ["new", "viewed", "noted"].includes(item.status)).length);
const activeSlots = computed(() => slots.value.filter((slot) => slot.available));
const todayRequests = computed(() =>
  requests.value.filter((item) => {
    const value = item.slotStartTime || item.createdAt;
    return value ? new Date(value).toDateString() === new Date().toDateString() : false;
  })
);
const visibleRequests = computed(() => {
  if (requestFilter.value === "all") return requests.value;
  if (requestFilter.value === "today") return todayRequests.value;
  return requests.value.filter((item) => ["new", "viewed", "noted"].includes(item.status));
});
const sectionTitle = computed(() => {
  const titles: Record<TabKey, string> = {
    overview: profile.value?.displayName || "我的支持工作",
    requests: "请求处理",
    schedule: "排期管理",
    profile: "我的"
  };
  return titles[tab.value];
});
const sectionCopy = computed(() => {
  const copies: Record<TabKey, string> = {
    overview: "查看匿名请求、维护开放时段，并同步你在用户端展示的公开资料。",
    requests: "查看用户提交的支持请求，并更新当前处理状态。",
    schedule: "维护你可被预约的开放时段，停用不会影响历史记录。",
    profile: "维护公开资料和账号状态。"
  };
  return copies[tab.value];
});

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function statusLabel(status: SupportRequestStatus) {
  const labels: Record<SupportRequestStatus, string> = {
    new: "新请求",
    viewed: "已查看",
    noted: "已留意",
    closed: "已结束",
    withdrawn: "已撤回",
    spam: "垃圾"
  };
  return labels[status] ?? status;
}

function riskLabel(level: AssessmentRiskLevel) {
  const labels: Record<AssessmentRiskLevel, string> = {
    low: "低风险",
    medium: "需要关注",
    high: "高关注"
  };
  return labels[level] ?? level;
}

function toggleRequest(id: string) {
  expandedRequestId.value = expandedRequestId.value === id ? "" : id;
}

const counselorPageRoutes: Record<TabKey, string> = {
  overview: "/pages/counselor-workspace/index",
  requests: "/pages/counselor-requests/index",
  schedule: "/pages/counselor-schedule/index",
  profile: "/pages/counselor-profile/index"
};

function openCounselorPage(next: TabKey) {
  if (tab.value === next) return;
  uni.redirectTo({ url: counselorPageRoutes[next] });
}

function openRequests(filter: RequestFilter) {
  if (tab.value === "requests") {
    requestFilter.value = filter;
    return;
  }
  uni.redirectTo({ url: `${counselorPageRoutes.requests}?filter=${filter}` });
}

function openSecondaryPage(url: string) {
  uni.navigateTo({ url });
}

async function load() {
  error.value = "";
  if (!getCounselorToken()) {
    uni.reLaunch({ url: "/pages/login/index" });
    return;
  }

  try {
    const [me, slotList, requestList] = await Promise.all([getCounselorMe(), listCounselorOwnSlots(), listCounselorRequests()]);
    profile.value = me;
    slots.value = slotList;
    requests.value = requestList;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      clearCounselorToken();
      uni.reLaunch({ url: "/pages/login/index" });
      return;
    }
    error.value = err instanceof Error ? err.message : "工作区加载失败";
  }
}

async function toggleSlot(slot: SupportSlot) {
  await updateCounselorSlot(slot.id, { available: !slot.available });
  await load();
}

async function updateRequest(id: string, status: "viewed" | "noted" | "closed") {
  requests.value = await updateCounselorRequest(id, status);
  uni.showToast({ title: "已更新", icon: "success" });
}

onMounted(load);
</script>

<style scoped>
.counselor-page {
  padding-bottom: 160rpx;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.counselor-section-hero {
  margin-bottom: 22rpx;
}

.action-card,
.request-card {
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18rpx 48rpx rgba(28, 38, 70, 0.07);
  padding: 24rpx;
}

.overview-board {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  border-radius: 36rpx;
  background:
    radial-gradient(circle at 12% 0%, rgba(102, 119, 255, 0.18), transparent 32%),
    #ffffff;
  box-shadow: 0 22rpx 60rpx rgba(28, 38, 70, 0.08);
  padding: 30rpx;
}

.board-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.board-stat {
  border-radius: 28rpx;
  background: #f6f8ff;
  padding: 22rpx 14rpx;
  text-align: center;
}

.board-value {
  display: block;
  color: #263a59;
  font-size: 46rpx;
  font-weight: 900;
}

.board-action {
  width: 100%;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  border-radius: 20rpx;
  background: #eef2ff;
  color: #6677ff;
  font-size: 30rpx;
  font-weight: 850;
}

.mini-request {
  border-top: 1rpx solid #edf0f6;
  padding-top: 18rpx;
}

.request-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.risk-line {
  display: block;
  border-radius: 22rpx;
  background: #fff4df;
  color: #af6b10;
  padding: 16rpx 18rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.request-detail {
  border-top: 1rpx solid #edf0f6;
  padding-top: 16rpx;
}

.request-actions {
  margin-top: 4rpx;
}

.slot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border-top: 1rpx solid #edf0f6;
  padding-top: 20rpx;
}

.counselor-bottom-nav {
  position: fixed;
  right: 28rpx;
  bottom: calc(22rpx + env(safe-area-inset-bottom));
  left: 28rpx;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  border: 1rpx solid rgba(222, 229, 241, 0.9);
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22rpx 70rpx rgba(28, 38, 70, 0.14);
  padding: 12rpx;
  backdrop-filter: blur(18px);
}

.bottom-nav-item {
  display: flex;
  min-height: 96rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5rpx;
  border-radius: 26rpx;
  background: transparent;
  color: #7a8799;
  font-size: 22rpx;
  font-weight: 750;
  line-height: 1.1;
  box-shadow: none;
  padding: 0;
}

.bottom-nav-item::after {
  border: 0;
}

.bottom-nav-icon {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
}

.bottom-nav-active {
  background: #eef2ff;
  color: #5265ee;
}
</style>
