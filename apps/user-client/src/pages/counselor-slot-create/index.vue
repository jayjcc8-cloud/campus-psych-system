<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">新增时段</text>
      <text class="title">设置一个开放时间</text>
      <text class="copy">用户只能选择开放且仍有余量的时段。后续停用不会影响历史记录。</text>
    </view>

    <view class="card stack">
      <view class="field">
        <text class="label">开始时间</text>
        <input v-model="form.startTime" type="datetime-local" />
      </view>
      <view class="field">
        <text class="label">结束时间</text>
        <input v-model="form.endTime" type="datetime-local" />
      </view>
      <view class="field">
        <text class="label">容量</text>
        <input v-model="form.capacity" type="number" />
      </view>
      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="save">{{ loading ? "保存中..." : "保存时段" }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { createCounselorSlot } from "../../api/client";

const form = reactive({ startTime: "", endTime: "", capacity: 4 });
const loading = ref(false);
const error = ref("");

function toIso(value: string) {
  return new Date(value).toISOString();
}

async function save() {
  error.value = "";
  if (!form.startTime || !form.endTime) {
    error.value = "请选择开始和结束时间。";
    return;
  }
  loading.value = true;
  try {
    await createCounselorSlot({
      startTime: toIso(form.startTime),
      endTime: toIso(form.endTime),
      capacity: Number(form.capacity),
      available: true
    });
    uni.showToast({ title: "已保存", icon: "success" });
    setTimeout(() => {
      uni.redirectTo({ url: "/pages/counselor-schedule/index" });
    }, 500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "保存失败";
  } finally {
    loading.value = false;
  }
}
</script>
