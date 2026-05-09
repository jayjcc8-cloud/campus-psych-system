<template>
  <view class="page page-with-footer">
    <!-- #ifdef MP-WEIXIN -->
    <view class="top-nav">
      <text class="back-link" @click="goHome">‹</text>
      <view class="top-title">
        <text class="page-title compact-title">选择咨询师</text>
        <text class="muted">选择一位你愿意沟通的咨询师</text>
      </view>
    </view>
    <!-- #endif -->

    <view class="step-strip">
      <text class="step-item step-active">选择咨询师</text>
      <text class="step-item">选择时间</text>
      <text class="step-item">确认预约</text>
    </view>

    <view v-if="assessmentId" class="linked-assessment-card">
      <text class="mini-tag">已关联测评结果</text>
      <text class="muted">预约提交后，咨询师仅能看到风险等级和量表摘要，不会看到逐题答案。</text>
    </view>

    <view class="stack">
      <text v-if="loading" class="muted">正在同步咨询师资料...</text>
      <text v-if="error" class="error">{{ error }}</text>

      <view v-for="item in counselors" :key="item.id" class="counselor-card interactive" @click="selectCounselor(item)">
        <view class="row-start">
          <view class="portrait">{{ item.displayName.slice(0, 1) }}</view>
          <view class="counselor-main">
            <view class="row-between">
              <view>
                <text class="label-text">{{ item.displayName }}</text>
                <text class="muted">倾向：{{ item.specialties.slice(0, 2).join(" / ") || item.title || "心理支持" }}</text>
              </view>
              <text class="pill" :class="item.nextAvailableTime ? 'pill-soft' : 'pill-warn'">
                {{ item.nextAvailableTime ? "可约" : "暂无" }}
              </text>
            </view>
            <text class="copy counselor-style">{{ item.intro }}</text>
            <text class="muted">最近可约：{{ item.nextAvailableTime ? formatShortTime(item.nextAvailableTime) : "暂未开放" }}</text>
          </view>
          <text class="select-dot" :class="{ 'select-dot-active': selectedId === item.id }">✓</text>
        </view>
      </view>

      <view v-if="!loading && counselors.length === 0" class="card empty">
        <text class="label-text">暂未开放咨询师资料</text>
        <text class="muted">可以稍后再来查看。</text>
      </view>
    </view>

    <view class="summary-bar">
      <view class="row-between">
        <view>
          <text class="label">本次预约</text>
          <text class="muted">时间：下一步选择</text>
          <text class="muted">咨询师：{{ selectedCounselor?.displayName || "未选择" }}</text>
        </view>
        <button class="compact-button" :disabled="!selectedCounselor" @click="next">下一步</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from "@dcloudio/uni-app";
import { computed, onMounted, ref } from "vue";
import type { CounselorProfile } from "@teacher-support/shared";
import { listCounselors } from "../../api/client";
import { consumeTabQuery } from "../../utils/navigation";

const counselors = ref<CounselorProfile[]>([]);
const selectedId = ref("");
const loading = ref(false);
const error = ref("");
const assessmentId = ref("");
const preferredName = ref("");
const selectedCounselor = computed(() => counselors.value.find((item) => item.id === selectedId.value));

function formatShortTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function selectCounselor(item: CounselorProfile) {
  selectedId.value = item.id;
}

function next() {
  if (!selectedCounselor.value) return;
  const query = `id=${encodeURIComponent(selectedCounselor.value.id)}&assessmentId=${encodeURIComponent(assessmentId.value)}&preferredName=${encodeURIComponent(preferredName.value)}`;
  uni.navigateTo({
    url: `/pages/counselor-detail/index?${query}`,
    fail: (err) => {
      error.value = err.errMsg || "正在尝试重新打开下一步。";
      uni.reLaunch({ url: `/pages/counselor-detail/index?${query}` });
    }
  });
}

function goHome() {
  uni.switchTab({ url: "/pages/index/index" });
}

function syncPendingQuery() {
  const query = consumeTabQuery("/pages/counselors/index");
  if (typeof query.assessmentId === "string") assessmentId.value = query.assessmentId;
  if (typeof query.preferredName === "string") preferredName.value = query.preferredName;
}

function applyOptions(options: Record<string, unknown> = {}) {
  assessmentId.value = typeof options.assessmentId === "string" ? decodeURIComponent(options.assessmentId) : "";
  preferredName.value = typeof options.preferredName === "string" ? decodeURIComponent(options.preferredName) : "";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    counselors.value = await listCounselors();
    selectedId.value = counselors.value.find((item) => item.nextAvailableTime)?.id ?? counselors.value[0]?.id ?? "";
  } catch (err) {
    error.value = err instanceof Error ? err.message : "咨询师资料暂时不可用";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
onLoad((options) => applyOptions(options as Record<string, unknown>));
onShow(syncPendingQuery);
</script>

<style scoped>
.counselor-card {
  border-radius: 34rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 26rpx;
}

.portrait {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  flex: 0 0 120rpx;
  border-radius: 44rpx;
  background:
    radial-gradient(circle at 34% 20%, rgba(255, 220, 210, 0.84), transparent 25%),
    linear-gradient(145deg, #eef4ff, #dde4ff);
  color: #2563eb;
  font-size: 36rpx;
  font-weight: 900;
}

.counselor-main {
  min-width: 0;
  flex: 1;
}

.counselor-style {
  display: -webkit-box;
  overflow: hidden;
  margin: 12rpx 0 8rpx;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.select-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  flex: 0 0 42rpx;
  border: 3rpx solid #c7cfdd;
  border-radius: 999rpx;
  color: transparent;
  font-size: 22rpx;
}

.select-dot-active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.linked-assessment-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 24rpx;
  border-radius: 28rpx;
  background: #eef6ff;
  padding: 24rpx;
}
</style>
