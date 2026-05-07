<template>
  <view class="page page-with-footer">
    <view class="top-nav">
      <text class="back-link" @click="goHome">‹</text>
      <view class="top-title">
        <text class="page-title compact-title">选择咨询师</text>
        <text class="muted">选择一位你愿意尝试沟通的咨询师</text>
      </view>
    </view>

    <view class="step-strip">
      <text class="step-item step-active">选咨询师</text>
      <text class="step-item">选时间</text>
      <text class="step-item">确认预约</text>
    </view>

    <view class="stack">
      <text v-if="loading" class="muted">正在同步咨询师资料...</text>
      <text v-if="error" class="error">{{ error }}</text>

      <view
        v-for="item in counselors"
        :key="item.id"
        class="counselor-card interactive"
        @click="openCounselor(item)"
      >
        <view class="row-start">
          <view class="avatar">{{ item.displayName.slice(0, 1) }}</view>
          <view class="counselor-main">
            <view class="row-between">
              <view>
                <text class="label-text">{{ item.displayName }}</text>
                <text class="muted">{{ item.title || "心理支持老师" }}</text>
              </view>
              <text class="pill" :class="item.nextAvailableTime ? 'pill-soft' : 'pill-warn'">
                {{ item.nextAvailableTime ? "可约" : "暂无" }}
              </text>
            </view>
            <text class="copy clamp">{{ item.intro }}</text>
          </view>
        </view>
        <view class="tag-row">
          <text v-for="tag in item.specialties.slice(0, 4)" :key="tag" class="mini-tag">{{ tag }}</text>
        </view>
        <view class="row-between footer-line">
          <text class="muted">{{ item.nextAvailableTime ? `最近可选：${formatShortTime(item.nextAvailableTime)}` : "暂未开放时段" }}</text>
          <button class="select-button compact-button" :class="{ 'select-button-active': item.nextAvailableTime }" @click.stop="openCounselor(item)">
            {{ item.nextAvailableTime ? "选择时间" : "查看详情" }}
          </button>
        </view>
      </view>

      <view v-if="!loading && counselors.length === 0" class="card empty">
        <text class="label-text">暂未开放咨询师资料</text>
        <text class="muted">可以稍后再来查看。</text>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { onMounted, ref } from "vue";
import type { CounselorProfile } from "@teacher-support/shared";
import { listCounselors } from "../../api/client";
import { consumeTabQuery } from "../../utils/navigation";

const counselors = ref<CounselorProfile[]>([]);
const loading = ref(false);
const error = ref("");
const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const assessmentId = ref(decodeURIComponent(current?.options?.assessmentId ?? ""));
const preferredName = ref(decodeURIComponent(current?.options?.preferredName ?? ""));

function formatShortTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function openCounselor(item: CounselorProfile) {
  const query = `id=${encodeURIComponent(item.id)}&assessmentId=${encodeURIComponent(assessmentId.value)}&preferredName=${encodeURIComponent(preferredName.value)}`;
  uni.navigateTo({ url: `/pages/counselor-detail/index?${query}` });
}

function goHome() {
  uni.switchTab({ url: "/pages/index/index" });
}

function syncPendingQuery() {
  const query = consumeTabQuery("/pages/counselors/index");
  if (typeof query.assessmentId === "string") {
    assessmentId.value = query.assessmentId;
  }
  if (typeof query.preferredName === "string") {
    preferredName.value = query.preferredName;
  }
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    counselors.value = await listCounselors();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "咨询师资料暂时不可用";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
onShow(syncPendingQuery);
</script>

<style scoped>
.counselor-card {
  border: 1rpx solid rgba(95, 105, 137, 0.1);
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20rpx 54rpx rgba(28, 38, 70, 0.07);
  padding: 26rpx;
}

.counselor-main {
  min-width: 0;
  flex: 1;
}

.clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.footer-line {
  margin-top: 18rpx;
}

.select-button {
  min-width: 128rpx;
}

.select-button-active {
  background: #263a59;
  color: #ffffff;
}
</style>
