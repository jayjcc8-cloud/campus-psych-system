<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { issueTypeLabels, requestStatusLabels, type SupportRequestSummary } from "@teacher-support/shared";
import { listEvents, listRequests, updateRequest } from "../api/client";
import AdminShell from "../components/AdminShell.vue";

const requests = ref<SupportRequestSummary[]>([]);
const activeStatus = ref("all");
const loading = ref(false);
const error = ref("");
const selected = ref<SupportRequestSummary | null>(null);
const events = ref<Array<{ id: string; eventType: string; detail?: string; createdAt: string }>>([]);
const revealContact = ref(false);

const visibleRequests = computed(() =>
  activeStatus.value === "all" ? requests.value : requests.value.filter((item) => item.status === activeStatus.value)
);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    requests.value = await listRequests();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

async function openDetail(item: SupportRequestSummary) {
  selected.value = item;
  revealContact.value = false;
  events.value = await listEvents(item.id);
}

async function changeStatus(item: SupportRequestSummary, status: "viewed" | "noted" | "closed" | "spam") {
  await updateRequest(item.id, status);
  await load();
  if (selected.value?.id === item.id) {
    selected.value = requests.value.find((request) => request.id === item.id) ?? null;
  }
}

onMounted(load);
</script>

<template>
  <AdminShell>
    <div class="split-layout">
      <section>
        <div class="page-heading">
          <div>
            <p class="eyebrow">请求池</p>
            <h2>匿名支持请求</h2>
          </div>
          <button @click="load">刷新</button>
        </div>

        <div class="toolbar">
          <button :class="{ active: activeStatus === 'all' }" @click="activeStatus = 'all'">全部</button>
          <button
            v-for="status in ['new', 'viewed', 'noted', 'closed', 'withdrawn', 'spam']"
            :key="status"
            :class="{ active: activeStatus === status }"
            @click="activeStatus = status"
          >
            {{ requestStatusLabels[status as keyof typeof requestStatusLabels] }}
          </button>
        </div>

        <p v-if="loading" class="muted">正在同步请求池...</p>
        <p v-if="error" class="error">{{ error }}</p>

        <div class="request-grid">
          <article
            v-for="item in visibleRequests"
            :key="item.id"
            class="request-card"
            :class="{ selected: selected?.id === item.id }"
            @click="openDetail(item)"
          >
            <div>
              <p class="eyebrow">{{ issueTypeLabels[item.issueType] }}</p>
              <h3>{{ requestStatusLabels[item.status] }}</h3>
              <p>{{ new Date(item.slotStartTime || item.createdAt).toLocaleString() }}</p>
            </div>
            <span class="pill">{{ item.abuseStatus === "spam" ? "垃圾" : "匿名" }}</span>
          </article>

          <p v-if="!loading && visibleRequests.length === 0" class="empty-card">当前没有符合条件的请求。</p>
        </div>
      </section>

      <section class="detail-panel" v-if="selected">
        <p class="eyebrow">请求详情</p>
        <h2>{{ issueTypeLabels[selected.issueType] }}</h2>
        <p class="muted">请求编号 {{ selected.id }}</p>
        <p>{{ selected.remark || "未填写补充说明" }}</p>
        <div class="contact-box">
          <button class="secondary" @click="revealContact = !revealContact">
            {{ revealContact ? "隐藏联系方式" : "查看可选联系方式" }}
          </button>
          <p v-if="revealContact">{{ selected.contactEmail || selected.contactNote || "未留下联系方式" }}</p>
        </div>
        <div class="action-row">
          <button @click="changeStatus(selected, 'viewed')">已查看</button>
          <button @click="changeStatus(selected, 'noted')">已留意</button>
          <button @click="changeStatus(selected, 'closed')">关闭</button>
          <button class="danger" @click="changeStatus(selected, 'spam')">标记垃圾</button>
        </div>
        <h3>事件记录</h3>
        <ul class="event-list">
          <li v-for="event in events" :key="event.id">
            {{ new Date(event.createdAt).toLocaleString() }} · {{ event.eventType }}
          </li>
        </ul>
      </section>

      <section class="detail-panel empty-detail" v-else>
        <p class="eyebrow">请求详情</p>
        <h2>选择一条请求</h2>
        <p class="muted">详情、联系方式和事件记录会在这里展示。</p>
      </section>
    </div>
  </AdminShell>
</template>
