<template>
  <view class="page">
    <view class="card stack">
      <text class="label-text">正在前往登录页</text>
      <text class="muted">登录/注册已迁移到独立登录页。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  uni.redirectTo({ url: "/pages/login/index" });
});
</script>
