<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">咨询师端</text>
      <text class="title">{{ profile?.displayName || "我的工作区" }}</text>
      <text class="copy">维护公开资料、开放时段，并处理分配给你的匿名支持请求。</text>
    </view>

    <view class="stack">
      <view class="card stack">
        <view class="row-between">
          <text class="label">公开资料</text>
          <button class="button-soft compact-button" @click="saveProfile">保存</button>
        </view>
        <view class="field">
          <text class="label">职称/身份</text>
          <input v-model="profileForm.title" />
        </view>
        <view class="field">
          <text class="label">简介</text>
          <textarea v-model="profileForm.intro" maxlength="600" />
        </view>
        <view class="field">
          <text class="label">公开标签</text>
          <input v-model="specialtyText" placeholder="用顿号或逗号分隔" />
        </view>
      </view>

      <view class="card stack">
        <text class="label">新增开放时段</text>
        <view class="field">
          <text class="label">开始时间</text>
          <input v-model="slotForm.startTime" type="datetime-local" />
        </view>
        <view class="field">
          <text class="label">结束时间</text>
          <input v-model="slotForm.endTime" type="datetime-local" />
        </view>
        <view class="field">
          <text class="label">容量</text>
          <input v-model="slotForm.capacity" type="number" />
        </view>
        <button class="button-soft" @click="createSlot">保存时段</button>
      </view>

      <view class="card stack">
        <text class="label">我的开放时段</text>
        <view v-for="slot in slots" :key="slot.id" class="choice">
          <text>{{ formatTime(slot.startTime) }}</text>
          <text class="muted">至 {{ formatTime(slot.endTime) }} · 剩余 {{ slot.remainingCapacity ?? "-" }}</text>
          <button class="button-soft compact-button" @click="toggleSlot(slot)">{{ slot.available ? "停用" : "启用" }}</button>
        </view>
        <text v-if="slots.length === 0" class="muted">暂未设置开放时段。</text>
      </view>

      <view class="card stack">
        <text class="label">我的匿名请求</text>
        <view v-for="item in requests" :key="item.id" class="choice">
          <view class="row-between">
            <text class="label-text">{{ item.preferredName || "匿名用户" }}</text>
            <text class="pill">{{ item.status }}</text>
          </view>
          <text class="muted">{{ formatTime(item.slotStartTime || item.createdAt) }}</text>
          <text v-if="item.assessmentRiskLevel" class="muted">关联测评：{{ item.assessmentRiskLevel }}</text>
          <text class="copy">{{ item.remark || "未填写补充说明" }}</text>
          <view class="grid">
            <button class="button-soft compact-button" @click="updateRequest(item.id, 'viewed')">已查看</button>
            <button class="button-soft compact-button" @click="updateRequest(item.id, 'noted')">已留意</button>
            <button class="button-soft compact-button" @click="updateRequest(item.id, 'closed')">已结束</button>
          </view>
        </view>
        <text v-if="requests.length === 0" class="muted">当前暂无匿名请求。</text>
      </view>

      <text v-if="error" class="error">{{ error }}</text>
      <button class="button-ghost" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { CounselorProfile, SupportRequestSummary, SupportSlot } from "@teacher-support/shared";
import {
  clearCounselorToken,
  createCounselorSlot,
  getCounselorMe,
  getCounselorToken,
  listCounselorOwnSlots,
  listCounselorRequests,
  updateCounselorMe,
  updateCounselorRequest,
  updateCounselorSlot
} from "../../api/client";

const profile = ref<CounselorProfile | null>(null);
const slots = ref<SupportSlot[]>([]);
const requests = ref<SupportRequestSummary[]>([]);
const error = ref("");
const specialtyText = ref("");
const profileForm = reactive({ title: "", intro: "" });
const slotForm = reactive({ startTime: "", endTime: "", capacity: 4 });

function formatTime(value?: string) {
  return value ? new Date(value).toLocaleString() : "";
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

async function load() {
  error.value = "";
  if (!getCounselorToken()) {
    uni.redirectTo({ url: "/pages/counselor-login/index" });
    return;
  }

  try {
    const [me, slotList, requestList] = await Promise.all([getCounselorMe(), listCounselorOwnSlots(), listCounselorRequests()]);
    profile.value = me;
    profileForm.title = me.title;
    profileForm.intro = me.intro;
    specialtyText.value = me.specialties.join("、");
    slots.value = slotList;
    requests.value = requestList;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "工作区加载失败";
  }
}

async function saveProfile() {
  const specialties = specialtyText.value
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  profile.value = await updateCounselorMe({ ...profileForm, specialties });
  await load();
  uni.showToast({ title: "已保存", icon: "success" });
}

async function createSlot() {
  if (!slotForm.startTime || !slotForm.endTime) {
    error.value = "请选择开始和结束时间。";
    return;
  }
  await createCounselorSlot({
    startTime: toIso(slotForm.startTime),
    endTime: toIso(slotForm.endTime),
    capacity: Number(slotForm.capacity),
    available: true
  });
  slotForm.startTime = "";
  slotForm.endTime = "";
  slotForm.capacity = 4;
  await load();
}

async function toggleSlot(slot: SupportSlot) {
  await updateCounselorSlot(slot.id, { available: !slot.available });
  await load();
}

async function updateRequest(id: string, status: "viewed" | "noted" | "closed") {
  requests.value = await updateCounselorRequest(id, status);
}

function logout() {
  clearCounselorToken();
  uni.redirectTo({ url: "/pages/counselor-login/index" });
}

onMounted(load);
</script>
