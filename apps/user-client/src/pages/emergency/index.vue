<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">紧急支持</text>
      <text class="title">如果此刻需要立即帮助</text>
      <text class="copy">请优先联系身边可信任的人，或直接使用当地急救、报警和公开心理援助资源。</text>
    </view>

    <view class="stack">
      <view class="urgent-card">
        <text class="label-text">即时危险</text>
        <text class="copy">如你或他人正处于即时危险中，请优先拨打当地紧急服务。</text>
        <view class="emergency-actions">
          <button @click="call('110')">拨打 110</button>
          <button class="button-soft" @click="call('120')">拨打 120</button>
        </view>
      </view>

      <view v-for="item in resources" :key="item.name" class="resource-card">
        <view>
          <text class="label-text">{{ item.name }}</text>
          <text class="muted">{{ item.description }}</text>
        </view>
        <view class="phone-list">
          <button
            v-for="phone in item.phones"
            :key="phone"
            class="button-light compact-button"
            @click="call(phone)"
          >
            {{ phone }}
          </button>
        </view>
      </view>

      <view class="notice-card">
        <text class="label-text">重要说明</text>
        <text class="muted">
          心理咨询中心仅提供公开资源信息整理，不运营上述热线，不保证第三方服务响应，也不承担第三方服务责任。服务可用性、服务时间和号码归属以官方最新公布为准。
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const resources = [
  {
    name: "全国统一心理援助热线",
    description: "国家统筹设立的心理援助热线资源。部分地区接入和服务时间可能存在差异。",
    phones: ["12356"]
  },
  {
    name: "北京心理危机研究与干预中心热线",
    description: "公开发布的心理危机干预热线资源，可作为紧急心理支持信息参考。",
    phones: ["01082951332", "8008101117"]
  }
];

function call(phone: string) {
  uni.makePhoneCall({
    phoneNumber: phone,
    fail: () => {
      uni.showModal({
        title: "拨号提示",
        content: `请手动拨打 ${phone}`,
        showCancel: false
      });
    }
  });
}
</script>

<style scoped>
.urgent-card,
.resource-card,
.notice-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 52rpx rgba(31, 41, 55, 0.06);
  padding: 30rpx;
}

.urgent-card {
  border: 1rpx solid rgba(239, 68, 68, 0.18);
  background: #fff7f7;
}

.emergency-actions,
.phone-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.phone-list {
  grid-template-columns: repeat(auto-fit, minmax(220rpx, 1fr));
}

.notice-card {
  background: #f8fafc;
}
</style>
