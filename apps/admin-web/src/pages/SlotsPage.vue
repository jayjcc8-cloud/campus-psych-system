<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { supportSlotModeLabels, type SupportSlot } from "@teacher-support/shared";
import { listSlots, updateSlot } from "../api/client";
import AdminShell from "../components/AdminShell.vue";

const slots = ref<SupportSlot[]>([]);
const loading = ref(false);
const error = ref("");
const filter = ref<"upcoming" | "active" | "paused" | "history" | "all">("upcoming");

const upcomingSlots = computed(() => slots.value.filter((slot) => new Date(slot.endTime).getTime() >= Date.now()));
const historySlots = computed(() => slots.value.filter((slot) => new Date(slot.endTime).getTime() < Date.now()));
const activeSlots = computed(() => upcomingSlots.value.filter((slot) => slot.available && !slot.deletedAt));
const pausedSlots = computed(() => upcomingSlots.value.filter((slot) => !slot.available || slot.deletedAt));
const visibleSlots = computed(() => {
  if (filter.value === "active") return activeSlots.value;
  if (filter.value === "paused") return pausedSlots.value;
  if (filter.value === "history") return historySlots.value;
  if (filter.value === "all") return slots.value;
  return upcomingSlots.value;
});
const filterTabs = [
  { key: "upcoming", label: "近期时段" },
  { key: "active", label: "开放中" },
  { key: "paused", label: "已停用" },
  { key: "history", label: "历史" },
  { key: "all", label: "全部" }
] as const;

async function load() {
  loading.value = true;
  error.value = "";
  try {
    slots.value = await listSlots();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

async function toggleSlot(slot: SupportSlot) {
  await updateSlot(slot.id, { available: !slot.available });
  await load();
}

function formatRange(slot: SupportSlot) {
  return `${new Date(slot.startTime).toLocaleString()} - ${new Date(slot.endTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function occupancyPercent(slot: SupportSlot) {
  if (!slot.capacity) return 0;
  return Math.min(100, Math.round(((slot.activeCount ?? 0) / slot.capacity) * 100));
}

onMounted(load);
</script>

<template>
  <AdminShell>
    <div class="page-heading">
      <div>
        <p class="eyebrow">时段配置</p>
        <h2>中心开放时段</h2>
        <p class="muted">后台仅用于查看、筛选、停用/恢复和审计追踪；日常排期由咨询师端维护。</p>
      </div>
      <div class="heading-actions">
        <RouterLink class="button-link" to="/audit-logs">查看审计记录</RouterLink>
        <button @click="load">刷新</button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <p v-if="loading" class="muted">正在同步时段...</p>

    <section class="section-block">
      <div class="section-title-row">
        <h3>时段列表</h3>
        <div class="filter-tabs">
          <button
            v-for="item in filterTabs"
            :key="item.key"
            :class="{ active: filter === item.key }"
            @click="filter = item.key"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="slot-list">
        <article v-for="slot in visibleSlots" :key="slot.id" class="slot-card">
          <div>
            <strong>{{ formatRange(slot) }}</strong>
            <p class="muted">{{ slot.counselorName || "未关联咨询师" }}</p>
            <p class="muted">
              {{ supportSlotModeLabels[slot.mode] }} · {{ slot.location || slot.note || "地点待补充" }}
            </p>
            <div class="occupancy-block">
              <div class="occupancy-meta">
                <span>占用 {{ slot.activeCount ?? 0 }} / {{ slot.capacity }}</span>
                <span>{{ occupancyPercent(slot) }}%</span>
              </div>
              <div class="bar-track wide-track">
                <div class="bar-fill" :style="{ width: `${occupancyPercent(slot)}%` }" />
              </div>
            </div>
          </div>
          <div class="slot-actions">
            <span class="pill" :class="{ danger: !slot.available || slot.deletedAt }">
              {{ slot.deletedAt ? "已删除" : slot.available ? "开放中" : "已停用" }}
            </span>
            <button v-if="!slot.deletedAt" :class="{ danger: slot.available }" @click="toggleSlot(slot)">
              {{ slot.available ? "停用" : "恢复" }}
            </button>
          </div>
        </article>
        <p v-if="!loading && visibleSlots.length === 0" class="empty-card">暂无符合筛选条件的时段。</p>
      </div>
    </section>
  </AdminShell>
</template>
