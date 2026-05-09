<template>
  <view class="page">
    <view class="success-hero">
      <view class="success-mark">✓</view>
      <text class="title">预约成功</text>
      <text class="copy">你的预约已提交，当前状态为待确认。请妥善保存预约回执码，用于查看状态或撤回。</text>
    </view>

    <view class="card receipt-card">
      <text class="muted">预约回执码</text>
      <text class="receipt-code">{{ code }}</text>
      <button class="button-soft compact-button" @click="copy">复制回执码</button>
      <view class="countdown-row">
        <view>
          <text class="count-value">02</text>
          <text class="muted">天</text>
        </view>
        <view>
          <text class="count-value">03</text>
          <text class="muted">小时</text>
        </view>
        <view>
          <text class="count-value">18</text>
          <text class="muted">分钟</text>
        </view>
      </view>
      <view class="receipt-actions">
        <button class="button-light compact-button" @click="go('/pages/requests/index')">查看详情</button>
        <button class="button-soft compact-button" @click="go('/pages/counselors/index')">改时间</button>
      </view>
    </view>

    <view class="warm-note">
      <text class="label-text">温馨提示</text>
      <text class="muted">如有特殊情况需要调整，可以在“我的预约”中查看或撤回。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import { openPage } from "../../utils/navigation";

const code = ref("");

function copy() {
  uni.setClipboardData({ data: code.value });
}

function go(url: string) {
  openPage(url);
}

onLoad((options = {}) => {
  code.value = typeof options.code === "string" ? decodeURIComponent(options.code) : "";
});
</script>

<style scoped>
.success-hero {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 78rpx 24rpx 44rpx;
  text-align: center;
}

.success-hero .title {
  max-width: none;
}

.success-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 124rpx;
  height: 124rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 24rpx 60rpx rgba(37, 99, 235, 0.22);
  font-size: 64rpx;
  font-weight: 900;
}

.receipt-card {
  text-align: center;
}

.receipt-code {
  display: block;
  margin: 12rpx 0 20rpx;
  color: #101828;
  font-size: 38rpx;
  font-weight: 900;
  letter-spacing: 3rpx;
  word-break: break-all;
}

.countdown-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
  margin: 30rpx 0;
  border-top: 1rpx solid #edf0f6;
  border-bottom: 1rpx solid #edf0f6;
  padding: 24rpx 0;
}

.count-value {
  display: block;
  color: #101828;
  font-size: 44rpx;
  font-weight: 900;
}

.receipt-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.warm-note {
  margin-top: 32rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 30rpx;
}
</style>
