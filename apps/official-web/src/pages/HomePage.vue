<template>
  <PageShell
    hero
    kicker="隐私优先 · 安心专业 · 公益支持"
    title="更安心的心理支持预约入口"
    copy="我们提供便捷、专业、隐私友好的预约与支持服务。官网用于说明服务边界和使用方式，真实预约、测评与咨询师处理均在小程序中完成。"
  >
    <template #actions>
      <div class="hero-actions">
        <button class="primary-button" @click="$emit('navigate', 'miniapp')">在小程序中使用</button>
        <button class="secondary-button" @click="$emit('navigate', 'demo')">查看功能演示</button>
      </div>
      <div class="trust-row">
        <span>专业团队</span>
        <span>隐私保护</span>
        <span>公益性质</span>
      </div>
    </template>

    <div class="hero-visual" aria-label="小程序预约流程预览">
      <PhoneMock />
      <div class="floating-panel panel-top">
        <span class="panel-dot"></span>
        <div>
          <strong>隐私协议启用</strong>
          <p>最小化收集，关键操作留痕</p>
        </div>
      </div>
      <div class="floating-panel panel-bottom">
        <strong>3 项量表</strong>
        <p>WHO-5 / PHQ-9 / GAD-7 筛查参考</p>
      </div>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import PhoneMock from "../components/PhoneMock.vue";
import PageShell from "../components/PageShell.vue";
import type { PageKey } from "../content";

defineEmits<{
  navigate: [page: PageKey];
}>();
</script>
