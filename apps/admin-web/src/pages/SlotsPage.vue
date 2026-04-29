<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { SupportSlot } from "@teacher-support/shared";
import { createSlot, listSlots, updateSlot } from "../api/client";
import AdminShell from "../components/AdminShell.vue";

const slots = ref<SupportSlot[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const form = ref({
  startTime: "",
  endTime: "",
  capacity: 4
});

const upcomingSlots = computed(() => slots.value.filter((slot) => new Date(slot.endTime).getTime() >= Date.now()));
const historySlots = computed(() => slots.value.filter((slot) => new Date(slot.endTime).getTime() < Date.now()));

function toIso(value: string) {
  return new Date(value).toISOString();
}

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

async function submit() {
  if (!form.value.startTime || !form.value.endTime) {
    error.value = "请选择开始和结束时间。";
    return;
  }

  saving.value = true;
  error.value = "";
  try {
    await createSlot({
      startTime: toIso(form.value.startTime),
      endTime: toIso(form.value.endTime),
      capacity: Number(form.value.capacity),
      available: true
    });
    form.value = { startTime: "", endTime: "", capacity: 4 };
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "保存失败";
  } finally {
    saving.value = false;
  }
}

async function toggleSlot(slot: SupportSlot) {
  await updateSlot(slot.id, { available: !slot.available });
  await load();
}

async function changeCapacity(slot: SupportSlot, event: Event) {
  const target = event.target as HTMLInputElement;
  await updateSlot(slot.id, { capacity: Number(target.value) });
  await load();
}

onMounted(load);
</script>

<template>
  <AdminShell>
    <div class="page-heading">
      <div>
        <p class="eyebrow">时段配置</p>
        <h2>中心开放时段</h2>
      </div>
      <button @click="load">刷新</button>
    </div>

    <section class="form-card">
      <h3>新增时段</h3>
      <div class="form-grid">
        <label>
          开始时间
          <input v-model="form.startTime" type="datetime-local" />
        </label>
        <label>
          结束时间
          <input v-model="form.endTime" type="datetime-local" />
        </label>
        <label>
          容量
          <input v-model.number="form.capacity" min="1" max="20" type="number" />
        </label>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="saving" @click="submit">{{ saving ? "保存中..." : "保存时段" }}</button>
    </section>

    <p v-if="loading" class="muted">正在同步时段...</p>

    <section class="section-block">
      <h3>近期时段</h3>
      <div class="slot-list">
        <article v-for="slot in upcomingSlots" :key="slot.id" class="slot-card">
          <div>
            <strong>{{ new Date(slot.startTime).toLocaleString() }}</strong>
            <p class="muted">{{ slot.counselorName || "未关联咨询师" }}</p>
            <p class="muted">至 {{ new Date(slot.endTime).toLocaleString() }}</p>
            <p class="muted">已占用 {{ slot.activeCount ?? 0 }} / {{ slot.capacity }}</p>
          </div>
          <div class="slot-actions">
            <input
              class="capacity-input"
              type="number"
              min="1"
              max="20"
              :value="slot.capacity"
              @change="changeCapacity(slot, $event)"
            />
            <button :class="{ danger: slot.available }" @click="toggleSlot(slot)">
              {{ slot.available ? "停用" : "启用" }}
            </button>
          </div>
        </article>
        <p v-if="!loading && upcomingSlots.length === 0" class="empty-card">暂无近期时段。</p>
      </div>
    </section>

    <section class="section-block">
      <h3>历史时段</h3>
      <div class="slot-list compact">
        <article v-for="slot in historySlots" :key="slot.id" class="slot-card muted-card">
          <div>
            <strong>{{ new Date(slot.startTime).toLocaleString() }}</strong>
            <p class="muted">{{ slot.counselorName || "未关联咨询师" }}</p>
            <p class="muted">容量 {{ slot.capacity }}，已占用 {{ slot.activeCount ?? 0 }}</p>
          </div>
          <span class="pill">历史</span>
        </article>
        <p v-if="!loading && historySlots.length === 0" class="empty-card">暂无历史时段。</p>
      </div>
    </section>
  </AdminShell>
</template>
