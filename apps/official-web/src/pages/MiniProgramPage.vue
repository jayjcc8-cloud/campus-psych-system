<template>
  <PageShell
    kicker="小程序入口"
    title="真实操作请回到小程序完成"
    copy="用户预约、心理测评、我的预约、咨询师排期和状态处理均在小程序中完成。官网不会承接登录或提交行为。"
  >
    <div class="miniapp-layout">
      <QrPanel />
      <div class="miniapp-guide">
        <article v-for="item in guide" :key="item.title" class="guide-card">
          <strong>{{ item.title }}</strong>
          <p>{{ item.copy }}</p>
        </article>
        <div class="boundary-card">
          <strong>责任边界</strong>
          <p>官网仅提供服务说明和使用引导，不提供医疗诊断或治疗建议。紧急情况请联系当地急救或报警资源。</p>
        </div>
      </div>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from "../components/PageShell.vue";
import QrPanel from "../components/QrPanel.vue";

const guide = [
  { title: "用户", copy: "登录邮箱账号后完成预约、测评和我的预约查看。" },
  { title: "咨询师", copy: "在小程序端维护排期、查看预约并更新状态。" },
  { title: "后台", copy: "管理人员继续使用独立后台查看看板、审核和审计。" }
];
</script>
