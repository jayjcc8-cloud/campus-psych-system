<template>
  <view class="page">
    <view class="hero hero-compact">
      <text class="eyebrow">排期管理</text>
      <text class="title">{{ slotId ? "管理可预约时段" : "新增可预约时段" }}</text>
      <text class="copy">选择日期、时间、预约方式和地点，用户预约成功后会在确认单中看到这些信息。</text>
    </view>

    <view class="card stack">
      <view class="field">
        <text class="label">日期</text>
        <picker mode="date" :value="form.date" @change="onDateChange">
          <view class="picker-cell">
            <text>{{ form.date }}</text>
            <text class="chevron">›</text>
          </view>
        </picker>
      </view>

      <view class="time-grid">
        <view class="field">
          <text class="label">开始时间</text>
          <picker mode="time" :value="form.startClock" @change="onStartTimeChange">
            <view class="picker-cell">
              <text>{{ form.startClock }}</text>
              <text class="chevron">›</text>
            </view>
          </picker>
        </view>
        <view class="field">
          <text class="label">结束时间</text>
          <picker mode="time" :value="form.endClock" @change="onEndTimeChange">
            <view class="picker-cell">
              <text>{{ form.endClock }}</text>
              <text class="chevron">›</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="field">
        <text class="label">容量</text>
        <view class="capacity-row">
          <button class="button-light square-button" @click="adjustCapacity(-1)">-</button>
          <text class="capacity-value">{{ form.capacity }}</text>
          <button class="button-light square-button" @click="adjustCapacity(1)">+</button>
        </view>
      </view>

      <view class="field">
        <text class="label">预约方式</text>
        <view class="mode-row">
          <button
            v-for="item in modes"
            :key="item.value"
            class="mode-chip"
            :class="{ 'mode-active': form.mode === item.value }"
            @click="form.mode = item.value"
          >
            {{ item.label }}
          </button>
        </view>
      </view>

      <view class="field">
        <text class="label">{{ form.mode === "online" ? "会议说明" : "地点/会议说明" }}</text>
        <input v-model="form.location" :placeholder="locationPlaceholder" />
      </view>

      <view class="field">
        <text class="label">补充说明（可选）</text>
        <textarea v-model="form.note" maxlength="240" placeholder="例如：请提前 10 分钟到达，或确认后发送会议链接" />
        <text class="muted">{{ form.note.length }}/240</text>
      </view>

      <view class="slot-preview">
        <text class="muted">预览</text>
        <text class="label-text">{{ form.date }} {{ form.startClock }}-{{ form.endClock }}</text>
        <text class="muted">{{ supportSlotModeLabels[form.mode] }} · {{ form.location || locationPlaceholder }}</text>
      </view>

      <text v-if="error" class="error">{{ error }}</text>
      <button :disabled="loading" @click="save">{{ loading ? "保存中..." : slotId ? "保存修改" : "保存时段" }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, reactive, ref } from "vue";
import { supportSlotModeLabels, type SupportSlot, type SupportSlotMode } from "@teacher-support/shared";
import { createCounselorSlot, listCounselorOwnSlots, updateCounselorSlot } from "../../api/client";

const tomorrow = new Date(Date.now() + 86400000);
const slotId = ref("");
const form = reactive({
  date: toDateInput(tomorrow),
  startClock: "14:00",
  endClock: "15:00",
  capacity: 4,
  mode: "offline" as SupportSlotMode,
  location: "心理支持中心 201",
  note: ""
});
const loading = ref(false);
const error = ref("");
const modes: Array<{ value: SupportSlotMode; label: string }> = [
  { value: "offline", label: "线下" },
  { value: "online", label: "线上" },
  { value: "hybrid", label: "混合" }
];

const locationPlaceholder = computed(() => {
  if (form.mode === "online") return "例如：确认后发送会议链接";
  if (form.mode === "hybrid") return "例如：心理支持中心 201 / 可线上";
  return "例如：心理支持中心 201";
});

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function applySlot(slot: SupportSlot) {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  form.date = toDateInput(start);
  form.startClock = toTimeInput(start);
  form.endClock = toTimeInput(end);
  form.capacity = slot.capacity;
  form.mode = slot.mode;
  form.location = slot.location ?? "";
  form.note = slot.note ?? "";
}

function toTimeInput(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function onDateChange(event: any) {
  form.date = event.detail.value;
}

function onStartTimeChange(event: any) {
  form.startClock = event.detail.value;
}

function onEndTimeChange(event: any) {
  form.endClock = event.detail.value;
}

function adjustCapacity(delta: number) {
  form.capacity = Math.min(Math.max(form.capacity + delta, 1), 20);
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

async function save() {
  error.value = "";
  if ((form.mode === "offline" || form.mode === "hybrid") && !form.location.trim()) {
    error.value = "线下或混合预约需要填写地点。";
    return;
  }
  const startTime = toIso(form.date, form.startClock);
  const endTime = toIso(form.date, form.endClock);
  if (new Date(startTime).getTime() >= new Date(endTime).getTime()) {
    error.value = "结束时间需要晚于开始时间。";
    return;
  }

  loading.value = true;
  try {
    const payload = {
      startTime,
      endTime,
      capacity: Number(form.capacity),
      mode: form.mode,
      location: form.location,
      note: form.note,
      available: true
    };
    if (slotId.value) {
      await updateCounselorSlot(slotId.value, payload);
    } else {
      await createCounselorSlot(payload);
    }
    uni.showToast({ title: "已保存", icon: "success" });
    setTimeout(() => {
      uni.redirectTo({ url: "/pages/counselor-schedule/index" });
    }, 500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "保存失败";
  } finally {
    loading.value = false;
  }
}

async function loadSlot() {
  if (!slotId.value) return;
  loading.value = true;
  error.value = "";
  try {
    const slots = await listCounselorOwnSlots();
    const slot = slots.find((item) => item.id === slotId.value);
    if (!slot || slot.deletedAt) {
      error.value = "没有找到可编辑的排期。";
      return;
    }
    applySlot(slot);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "排期加载失败";
  } finally {
    loading.value = false;
  }
}

onLoad((options = {}) => {
  slotId.value = typeof options.id === "string" ? decodeURIComponent(options.id) : "";
  void loadSlot();
});
</script>

<style scoped>
.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.picker-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  border-radius: 24rpx;
  background: #f7f8fb;
  padding: 0 24rpx;
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
}

.capacity-row,
.mode-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.square-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  padding: 0;
  font-size: 34rpx;
}

.capacity-value {
  min-width: 80rpx;
  color: #111827;
  font-size: 34rpx;
  font-weight: 900;
  text-align: center;
}

.mode-chip {
  flex: 1;
  border-radius: 24rpx;
  background: #f7f8fb;
  color: #475569;
  font-weight: 800;
}

.mode-active {
  background: #2563eb;
  color: #ffffff;
}

.slot-preview {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  border-radius: 28rpx;
  background: #eef4ff;
  padding: 24rpx;
}
</style>
