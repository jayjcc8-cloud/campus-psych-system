<template>
  <view class="page">
    <view class="success-hero">
      <view class="success-mark">✓</view>
      <text class="title">预约成功</text>
      <text class="copy">请妥善保存匿名回执码。它只用于查看状态或撤回请求，不代表你必须回应或马上作出决定。</text>
    </view>

    <view class="card stack receipt-card">
      <text class="muted">匿名回执码</text>
      <text class="receipt-code">{{ code }}</text>
      <button @click="copy">复制回执码</button>
      <view class="grid">
        <button class="button-soft" @click="go('/pages/requests/index')">查看详情</button>
        <button class="button-light" @click="go('/pages/index/index')">回到首页</button>
      </view>
    </view>

    <view class="card soft-card stack-small">
      <text class="label-text">温馨提示</text>
      <text class="copy">如果之后想调整或撤回，可以在“我的预约”里使用本机回执查看状态。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { openPage } from "../../utils/navigation";

const code = ref("");
const pages = getCurrentPages();
const current = pages[pages.length - 1] as any;
code.value = decodeURIComponent(current?.options?.code ?? "");

function copy() {
  uni.setClipboardData({ data: code.value });
}

function go(url: string) {
  openPage(url);
}
</script>

<style scoped>
.success-hero {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 72rpx 24rpx 42rpx;
  text-align: center;
}

.success-hero .title {
  max-width: none;
}

.success-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 118rpx;
  height: 118rpx;
  border-radius: 999rpx;
  background: #707cff;
  color: #ffffff;
  box-shadow: 0 24rpx 60rpx rgba(102, 119, 255, 0.28);
  font-size: 62rpx;
  font-weight: 850;
}

.receipt-card {
  text-align: center;
}

.receipt-code {
  display: block;
  color: #101828;
  font-size: 46rpx;
  font-weight: 850;
  letter-spacing: 4rpx;
}
</style>
