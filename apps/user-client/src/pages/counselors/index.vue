<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">咨询师</text>
      <text class="title">选择一位你愿意靠近的支持者</text>
      <text class="copy">你不需要判断问题类型，也不需要说明真实身份。先看资料，再选择一个合适的时间。</text>
    </view>

    <view class="stack">
      <text v-if="loading" class="muted">正在同步咨询师资料...</text>
      <text v-if="error" class="error">{{ error }}</text>

      <view v-for="item in counselors" :key="item.id" class="card stack-small" @click="open(item.id)">
        <view class="row-between">
          <view>
            <text class="label-text">{{ item.displayName }}</text>
            <text class="muted">{{ item.title }}</text>
          </view>
          <text class="pill">{{ item.nextAvailableTime ? "可预约" : "暂无时段" }}</text>
        </view>
        <text class="copy">{{ item.intro }}</text>
        <view class="tag-row">
          <text v-for="tag in item.specialties" :key="tag" class="mini-tag">{{ tag }}</text>
        </view>
        <text v-if="item.nextAvailableTime" class="muted">最近可选：{{ formatTime(item.nextAvailableTime) }}</text>
      </view>

      <view v-if="!loading && counselors.length === 0" class="card">
        <text class="copy">当前暂无已公开的咨询师资料。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { CounselorProfile } from "@teacher-support/shared";
import { listCounselors } from "../../api/client";

const counselors = ref<CounselorProfile[]>([]);
const loading = ref(false);
const error = ref("");
const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
const assessmentId = decodeURIComponent(current?.options?.assessmentId ?? "");
const preferredName = decodeURIComponent(current?.options?.preferredName ?? "");

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function open(id: string) {
  const query = `id=${encodeURIComponent(id)}&assessmentId=${encodeURIComponent(assessmentId)}&preferredName=${encodeURIComponent(preferredName)}`;
  uni.navigateTo({ url: `/pages/counselor-detail/index?${query}` });
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
</script>
