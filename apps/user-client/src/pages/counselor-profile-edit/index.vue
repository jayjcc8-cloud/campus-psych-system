<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">公开资料</text>
      <text class="title">让用户先了解你</text>
      <text class="copy">保持简洁、可信赖。这里的内容会展示在用户端咨询师列表和详情页。</text>
    </view>

    <view class="card stack">
      <view class="field">
        <text class="label">职称/身份</text>
        <input v-model="form.title" placeholder="例如 专职咨询师" />
      </view>
      <view class="field">
        <text class="label">简介</text>
        <textarea v-model="form.intro" maxlength="600" placeholder="用克制、清晰的方式介绍你的支持风格" />
      </view>
      <view class="field">
        <text class="label">公开标签</text>
        <input v-model="specialtyText" placeholder="用顿号或逗号分隔" />
      </view>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="save">{{ loading ? "保存中..." : "保存资料" }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ApiError, clearCounselorToken, getCounselorMe, updateCounselorMe } from "../../api/client";

const form = reactive({ title: "", intro: "" });
const specialtyText = ref("");
const loading = ref(false);
const error = ref("");

async function load() {
  try {
    const profile = await getCounselorMe();
    form.title = profile.title;
    form.intro = profile.intro;
    specialtyText.value = profile.specialties.join("、");
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      clearCounselorToken();
      uni.reLaunch({ url: "/pages/login/index" });
      return;
    }
    error.value = err instanceof Error ? err.message : "资料加载失败";
  }
}

async function save() {
  error.value = "";
  loading.value = true;
  try {
    const specialties = specialtyText.value
      .split(/[、,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
    await updateCounselorMe({ ...form, specialties });
    uni.showToast({ title: "已保存", icon: "success" });
    setTimeout(() => {
      uni.navigateBack();
    }, 500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "保存失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
