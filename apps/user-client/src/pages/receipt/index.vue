<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">已收到</text>
      <text class="title">这是你的匿名回执码</text>
      <text class="copy">请妥善保存。它只用于查看状态或撤回请求，不代表你必须回应或马上作出决定。</text>
    </view>
    <view class="card stack">
      <text class="title">{{ code }}</text>
      <button @click="copy">复制回执码</button>
      <button class="button-soft" @click="go('/pages/requests/index')">查看我的回执</button>
      <button class="button-ghost" @click="go('/pages/index/index')">回到首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";

const code = ref("");
const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
code.value = decodeURIComponent(current?.options?.code ?? "");

function copy() {
  uni.setClipboardData({ data: code.value });
}

function go(url: string) {
  uni.reLaunch({ url });
}
</script>
