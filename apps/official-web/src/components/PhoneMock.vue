<template>
  <div class="phone-card">
    <div class="phone-status"><span>9:41</span><span>●●●</span></div>
    <div class="phone-screen">
      <div class="soft-orb"></div>
      <p class="screen-title">{{ title }}</p>
      <p class="screen-copy">{{ copy }}</p>
      <div class="screen-cta">{{ action }}</div>
      <div class="mini-card">
        <span>{{ metaLabel }}</span>
        <strong>{{ metaValue }}</strong>
        <small>{{ metaHint }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    copy?: string;
    action?: string;
    metaLabel?: string;
    metaValue?: string;
    metaHint?: string;
  }>(),
  {
    title: "Hi，你辛苦了",
    copy: "找一个你愿意说话的时间",
    action: "预约心理咨询 →",
    metaLabel: "周老师",
    metaValue: "05/12 14:00-15:00",
    metaHint: "状态：待确认"
  }
);
</script>
