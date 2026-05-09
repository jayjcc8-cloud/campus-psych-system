<template>
  <PageShell
    kicker="服务流程"
    title="简单 5 步，完成预约"
    copy="用户只需要按页面提示完成选择与确认；咨询师在小程序端处理预约，状态会同步到用户的“我的预约”。"
  >
    <div class="timeline-card">
      <div class="timeline-line"></div>
      <article v-for="(item, index) in flowSteps" :key="item.title" class="timeline-item">
        <span class="timeline-index">0{{ index + 1 }}</span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.copy }}</p>
      </article>
    </div>
    <div class="notice-card">
      <strong>温馨提示</strong>
      <p>如需调整或取消，请提前在小程序“我的预约”中操作，并留意咨询师确认状态。</p>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from "../components/PageShell.vue";
import { flowSteps } from "../content";
</script>
