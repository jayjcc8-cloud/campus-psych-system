<template>
  <div class="qr-card" aria-label="小程序入口占位">
    <div class="qr-grid">
      <span v-for="item in 25" :key="item" :class="{ filled: item % 3 === 0 || item % 7 === 0 }"></span>
    </div>
    <strong>微信小程序入口</strong>
    <p>上线后替换为正式小程序码</p>
  </div>
</template>
