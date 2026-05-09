<template>
  <header class="site-header">
    <button class="brand" aria-label="返回首页" @click="$emit('change', 'home')">
      <span class="brand-mark">心</span>
      <span>
        <strong>心理咨询中心</strong>
        <small>更安心的心理支持预约系统</small>
      </span>
    </button>

    <nav class="nav-links" aria-label="主导航">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="nav-tab"
        :class="{ active: activePage === item.key }"
        @click="$emit('change', item.key)"
      >
        {{ item.label }}
      </button>
      <span class="nav-indicator" :style="{ '--active-index': activeIndex }"></span>
    </nav>

    <button class="nav-cta" @click="$emit('change', 'miniapp')">在小程序中使用</button>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { navItems, type PageKey } from "../content";

const props = defineProps<{
  activePage: PageKey;
}>();

defineEmits<{
  change: [page: PageKey];
}>();

const activeIndex = computed(() => Math.max(0, navItems.findIndex((item) => item.key === props.activePage)));
</script>
