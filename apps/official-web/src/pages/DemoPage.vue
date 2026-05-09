<template>
  <PageShell
    kicker="功能演示"
    title="体验完整的使用流程"
    copy="以下为小程序主要功能流程演示，所有内容均为模拟数据，不登录、不提交、不写入数据库。"
  >
    <div class="demo-layout">
      <div class="demo-step-list">
        <button
          v-for="(item, index) in demoSteps"
          :key="item.title"
          class="demo-step"
          :class="{ active: activeStep === index }"
          @click="activeStep = index"
        >
          <span>{{ index + 1 }}</span>
          <div>
            <strong>{{ item.title }}</strong>
            <small>{{ item.short }}</small>
          </div>
        </button>
      </div>

      <Transition name="device" mode="out-in">
        <div :key="activeStep" class="demo-device">
          <div class="device-head">
            <span>小程序演示</span>
            <span>{{ currentDemo.status }}</span>
          </div>
          <div class="device-body">
            <p class="device-title">{{ currentDemo.title }}</p>
            <p class="device-copy">{{ currentDemo.copy }}</p>
            <div class="device-card">
              <span>{{ currentDemo.primary }}</span>
              <strong>{{ currentDemo.detail }}</strong>
              <small>模拟状态，仅用于官网展示</small>
            </div>
            <div class="device-tags">
              <span v-for="tag in currentDemo.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import PageShell from "../components/PageShell.vue";
import { demoSteps } from "../content";

const activeStep = ref(0);
const currentDemo = computed(() => demoSteps[activeStep.value]);
</script>
