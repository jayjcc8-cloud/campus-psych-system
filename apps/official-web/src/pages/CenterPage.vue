<template>
  <PageShell
    kicker="关于心理咨询中心"
    title="专业、温暖、可信赖的心理支持服务"
    copy="我们把官网、小程序和后台的职责拆清楚：官网负责说明，小程序负责操作，后台负责审核、统计和审计。"
  >
    <div class="center-board">
      <article v-for="item in centerCards" :key="item.title" class="feature-card">
        <span class="feature-icon">{{ item.title.slice(0, 1) }}</span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.copy }}</p>
      </article>
      <article class="belief-card">
        <h3>我们的服务理念</h3>
        <p>
          每个人都可以按自己的节奏靠近支持。平台尽量降低操作负担，也把隐私边界、状态变化和预约信息说清楚。
        </p>
      </article>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from "../components/PageShell.vue";
import { centerCards } from "../content";
</script>
