<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">匿名心理支持</text>
      <text class="title">给自己留一个被支持的时间</text>
      <text class="copy">
        这里面向教师群体。你可以匿名提交支持请求，也可以选择是否留下邮箱。中心会在你选择的时段保持接纳和等待，不追问、不评价。
      </text>
      <view class="stack">
        <button @click="go('/pages/request/index')">提交支持请求</button>
        <button class="button-soft" @click="go('/pages/requests/index')">查看我的请求</button>
      </view>
    </view>

    <view class="stack">
      <view class="card">
        <text class="eyebrow">尊重自主</text>
        <text class="copy">如果你临时不想继续，不需要解释。你也可以通过回执码撤回请求。</text>
      </view>
      <view class="card">
        <text class="eyebrow">联系方式可选</text>
        <text class="copy">邮箱或备注只是为了你希望中心联系时使用，不填写也可以提交。</text>
      </view>
      <view class="grid">
        <button class="button-soft" @click="go('/pages/privacy/index')">隐私说明</button>
        <button class="button-soft" @click="go('/pages/emergency/index')">紧急支持</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
function go(url: string) {
  uni.navigateTo({ url });
}
</script>
