<template>
  <view class="page counselor-page">
    <view v-if="tab === 'overview'" class="counselor-workbench">
      <view class="counselor-head">
        <view class="row-start">
          <view class="avatar avatar-small">{{ profile?.displayName?.slice(0, 1) || "咨" }}</view>
          <view>
            <text class="card-title">{{ profile?.displayName || "工作台" }}</text>
            <text class="muted">{{ profile?.title || "咨询师" }}</text>
          </view>
        </view>
        <text class="pill pill-soft">今日</text>
      </view>

      <view class="stat-grid">
        <view class="stat-card interactive" @click="openRequests('active')">
          <text class="stat-value">{{ activeRequestCount }}</text>
          <text class="muted">待处理</text>
        </view>
        <view class="stat-card interactive" @click="openRequests('today')">
          <text class="stat-value">{{ todayRequests.length }}</text>
          <text class="muted">今日预约</text>
        </view>
        <view class="stat-card interactive" @click="openSecondaryPage('/pages/counselor-schedule/index')">
          <text class="stat-value">{{ activeSlots.length }}</text>
          <text class="muted">开放时段</text>
        </view>
      </view>

      <view class="schedule-card">
        <view class="row-between">
          <text class="card-title">今日日程</text>
          <button class="button-ghost compact-button" @click="openSecondaryPage('/pages/counselor-slot-create/index')">新增</button>
        </view>
        <view v-for="slot in todaySlots.slice(0, 3)" :key="slot.id" class="timeline-row">
          <text class="time-label">{{ formatClock(slot.startTime) }}</text>
          <view>
            <text class="label-text">{{ slot.available ? "可预约" : "已停用" }}</text>
            <text class="muted">容量 {{ slot.activeCount ?? 0 }}/{{ slot.capacity }}</text>
          </view>
        </view>
        <text v-if="todaySlots.length === 0" class="muted">今天暂未设置开放时段。</text>
      </view>

      <view class="card stack-small">
        <view class="row-between">
          <text class="card-title">最近预约</text>
          <button class="button-light compact-button" @click="openRequests('all')">全部</button>
        </view>
        <view v-for="item in requests.slice(0, 3)" :key="item.id" class="mini-request interactive" @click="openRequests('all')">
          <view>
            <text class="label-text">{{ item.preferredName || "匿名用户" }}</text>
            <text class="muted">{{ formatTime(item.slotStartTime || item.createdAt) }}</text>
          </view>
          <text class="pill">{{ statusLabel(item.status) }}</text>
        </view>
        <text v-if="requests.length === 0" class="muted">暂无预约。</text>
      </view>
    </view>

    <view v-if="tab === 'requests'" class="request-page">
      <text class="page-title">预约管理</text>
      <view class="segment">
        <button class="segment-item" :class="{ 'segment-active': requestFilter === 'active' }" @click="requestFilter = 'active'">待处理</button>
        <button class="segment-item" :class="{ 'segment-active': requestFilter === 'today' }" @click="requestFilter = 'today'">今日</button>
        <button class="segment-item" :class="{ 'segment-active': requestFilter === 'all' }" @click="requestFilter = 'all'">全部</button>
      </view>

      <view class="stack">
        <view v-for="item in visibleRequests" :key="item.id" class="teacher-request-card interactive" @click="toggleRequest(item.id)">
          <view class="row-between">
            <view>
              <text class="label-text">{{ item.preferredName || "匿名用户" }}</text>
              <text class="muted">{{ formatTime(item.slotStartTime || item.createdAt) }}</text>
            </view>
            <text class="pill" :class="item.status === 'closed' ? '' : 'pill-soft'">{{ statusLabel(item.status) }}</text>
          </view>
          <view class="meta-line">
            <text v-if="item.assessmentRiskLevel" class="mini-tag">{{ riskLabel(item.assessmentRiskLevel) }}</text>
            <text class="mini-tag">{{ item.remark ? "有说明" : "无补充" }}</text>
            <text class="mini-tag">{{ item.contactEmail || item.contactNote ? "有联系方式" : "无联系方式" }}</text>
          </view>
          <view v-if="expandedRequestId === item.id" class="request-detail">
            <text class="copy">{{ item.remark || "未填写补充说明" }}</text>
            <text v-if="item.contactEmail || item.contactNote" class="muted">联系方式：{{ item.contactEmail || item.contactNote }}</text>
          </view>
          <view class="grid-3">
            <button class="button-light compact-button" :disabled="item.status !== 'new'" @click.stop="updateRequest(item.id, 'viewed')">已查看</button>
            <button class="button-soft compact-button" :disabled="item.status === 'noted' || item.status === 'closed'" @click.stop="updateRequest(item.id, 'noted')">确认</button>
            <button class="compact-button" :disabled="item.status === 'closed'" @click.stop="updateRequest(item.id, 'closed')">完成</button>
          </view>
        </view>
        <view v-if="visibleRequests.length === 0" class="card empty">
          <text class="label-text">没有符合条件的预约</text>
          <text class="muted">新的预约会出现在这里。</text>
        </view>
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
            <text class="muted">同步用户端展示信息</text>
          </view>
          <text class="chevron">›</text>
        </view>
        <view class="settings-cell interactive" @click="openSecondaryPage('/pages/counselor-schedule/index')">
          <view>
            <text class="label-text">排期管理</text>
            <text class="muted">开放时段与容量</text>
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
      <button class="bottom-nav-item" :class="{ 'bottom-nav-active': tab === 'overview' }" @click="openCounselorPage('overview')">
        <text class="bottom-nav-icon">⌂</text>
        <text>工作台</text>
      </button>
      <button class="bottom-nav-item" :class="{ 'bottom-nav-active': tab === 'requests' }" @click="openCounselorPage('requests')">
        <text class="bottom-nav-icon">▣</text>
        <text>预约</text>
      </button>
      <button class="bottom-nav-item" :class="{ 'bottom-nav-active': tab === 'profile' }" @click="openCounselorPage('profile')">
        <text class="bottom-nav-icon">○</text>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";
import type { AssessmentRiskLevel, CounselorProfile, SupportRequestStatus, SupportRequestSummary, SupportSlot } from "@teacher-support/shared";
import {
  ApiError,
  clearCounselorToken,
  getCounselorMe,
  getCounselorToken,
  listCounselorOwnSlots,
  listCounselorRequests,
  updateCounselorRequest
} from "../../api/client";

type TabKey = "overview" | "requests" | "profile";
type RequestFilter = "active" | "all" | "today";

const props = withDefaults(defineProps<{ initialTab?: TabKey }>(), {
  initialTab: "overview"
});
const validTabs: TabKey[] = ["overview", "requests", "profile"];
const profile = ref<CounselorProfile | null>(null);
const slots = ref<SupportSlot[]>([]);
const requests = ref<SupportRequestSummary[]>([]);
const error = ref("");
const tab = ref<TabKey>(validTabs.includes(props.initialTab) ? props.initialTab : "overview");
const requestFilter = ref<RequestFilter>("active");
const expandedRequestId = ref("");

const activeRequestCount = computed(() => requests.value.filter((item) => ["new", "viewed", "noted"].includes(item.status)).length);
const activeSlots = computed(() => slots.value.filter((slot) => slot.available));
const todaySlots = computed(() => slots.value.filter((slot) => isToday(slot.startTime)));
const todayRequests = computed(() => requests.value.filter((item) => isToday(item.slotStartTime || item.createdAt)));
const visibleRequests = computed(() => {
  if (requestFilter.value === "all") return requests.value;
  if (requestFilter.value === "today") return todayRequests.value;
  return requests.value.filter((item) => ["new", "viewed", "noted"].includes(item.status));
});

function isToday(value?: string) {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
}

function formatClock(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${formatClock(value)}`;
}

function statusLabel(status: SupportRequestStatus) {
  const labels: Record<SupportRequestStatus, string> = {
    new: "待确认",
    viewed: "已查看",
    noted: "已确认",
    closed: "已完成",
    withdrawn: "已撤回",
    spam: "垃圾"
  };
  return labels[status] ?? status;
}

function riskLabel(level: AssessmentRiskLevel) {
  const labels: Record<AssessmentRiskLevel, string> = {
    low: "低风险",
    medium: "中等关注",
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

async function updateRequest(id: string, status: "viewed" | "noted" | "closed") {
  requests.value = await updateCounselorRequest(id, status);
  uni.showToast({ title: "已更新", icon: "success" });
}

onLoad((options = {}) => {
  const filter = typeof options.filter === "string" ? (decodeURIComponent(options.filter) as RequestFilter) : "active";
  requestFilter.value = ["active", "all", "today"].includes(filter) ? filter : "active";
});

onMounted(load);
</script>

<style scoped>
.counselor-page {
  padding-bottom: 162rpx;
}

.counselor-workbench {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.counselor-head,
.schedule-card,
.teacher-request-card {
  border-radius: 34rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 28rpx;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
}

.stat-card {
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 44rpx rgba(31, 41, 55, 0.06);
  padding: 24rpx 12rpx;
  text-align: center;
}

.stat-value {
  display: block;
  color: #101828;
  font-size: 46rpx;
  font-weight: 900;
}

.timeline-row,
.mini-request {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border-top: 1rpx solid #edf0f6;
  padding-top: 18rpx;
}

.timeline-row:first-of-type {
  margin-top: 18rpx;
}

.time-label {
  min-width: 86rpx;
  color: #2563eb;
  font-size: 28rpx;
  font-weight: 850;
}

.teacher-request-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.request-detail {
  border-top: 1rpx solid #edf0f6;
  padding-top: 16rpx;
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
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 22rpx 70rpx rgba(31, 41, 55, 0.13);
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
  color: #8a93a5;
  font-size: 22rpx;
  font-weight: 760;
  line-height: 1.1;
  box-shadow: none;
  padding: 0;
}

.bottom-nav-icon {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
}

.bottom-nav-active {
  background: #eff6ff;
  color: #2563eb;
}
</style>
