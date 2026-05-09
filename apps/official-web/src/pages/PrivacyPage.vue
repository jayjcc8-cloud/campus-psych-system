<template>
  <PageShell
    kicker="隐私安全保障"
    title="把隐私边界写在产品体验里"
    copy="平台以最小化收集、摘要展示和操作审计为原则，帮助用户和咨询师在明确边界下完成预约与支持。"
  >
    <div class="privacy-layout">
      <div class="privacy-grid">
        <article v-for="item in privacyCards" :key="item.title" class="privacy-card">
          <span class="privacy-icon">{{ item.icon }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.copy }}</p>
        </article>
      </div>
      <div class="data-diagram">
        <h3>数据边界说明</h3>
        <div class="diagram-row">
          <span>小程序</span>
          <i>加密传输 TLS 1.3</i>
          <span>心理咨询中心安全服务</span>
          <i>授权访问</i>
          <span>咨询师</span>
        </div>
        <ul>
          <li>用户个人信息只在必要场景使用。</li>
          <li>测评结果默认展示摘要，不展示逐题答案。</li>
          <li>后台关键操作可审计，访问受权限控制。</li>
        </ul>
      </div>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from "../components/PageShell.vue";
import { privacyCards } from "../content";
</script>
