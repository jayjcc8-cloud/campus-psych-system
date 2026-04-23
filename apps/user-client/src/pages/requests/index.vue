<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">本机回执</text>
      <text class="title">我的匿名请求</text>
      <text class="copy">这里只保存在本机。换设备时，可以使用回执码查询。</text>
    </view>
    <view class="stack">
      <view v-for="item in receipts" :key="item.receiptCode" class="card">
        <text class="pill">{{ item.receiptCode }}</text>
        <text class="muted">{{ new Date(item.createdAt).toLocaleString() }}</text>
        <button class="button-soft" @click="open(item.receiptCode)">查看状态</button>
      </view>
      <view v-if="receipts.length === 0" class="card">
        <text class="copy">本机还没有保存的请求。</text>
      </view>
      <button class="button-soft" @click="go('/pages/lookup/index')">用回执码查询</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import { listLocalReceipts, type LocalReceipt } from "../../utils/receipts";

const receipts = ref<LocalReceipt[]>([]);

function refresh() {
  receipts.value = listLocalReceipts();
}

function open(code: string) {
  uni.navigateTo({ url: `/pages/lookup/index?code=${encodeURIComponent(code)}` });
}

function go(url: string) {
  uni.navigateTo({ url });
}

onShow(refresh);
</script>
