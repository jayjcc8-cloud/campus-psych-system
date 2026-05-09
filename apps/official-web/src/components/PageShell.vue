<template>
  <section class="page-shell" :class="tone">
    <div class="page-copy">
      <p class="section-kicker">{{ kicker }}</p>
      <h1 v-if="hero">{{ title }}</h1>
      <h2 v-else>{{ title }}</h2>
      <p class="section-copy">{{ copy }}</p>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    kicker: string;
    title: string;
    copy: string;
    hero?: boolean;
    tone?: string;
  }>(),
  {
    hero: false,
    tone: ""
  }
);
</script>
