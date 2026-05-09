<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { LockOnIcon } from "tdesign-icons-vue-next";
import { assessmentRiskLabels, requestStatusLabels, type SupportRequestSummary } from "@teacher-support/shared";
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
const activeCount = computed(() => requests.value.filter((item) => ["new", "viewed", "noted"].includes(item.status)).length);
const riskCount = computed(() => requests.value.filter((item) => item.assessmentRiskLevel === "high").length);
const contactCount = computed(() => requests.value.filter((item) => item.contactEmail || item.contactNote).length);

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
            <p class="eyebrow">预约池</p>
            <h2>预约记录</h2>
            <p class="muted">优先处理仍在进行中的预约，联系方式默认折叠展示。</p>
          </div>
          <t-button theme="primary" @click="load">刷新</t-button>
        </div>

        <t-alert class="security-alert" theme="info" message="End-to-End Encrypted Data View" description="涉及联系方式或可识别信息的字段默认折叠，所有查看和状态更新都会进入审计记录。" />

        <div class="metrics-grid request-metrics">
          <article class="metric-card">
            <p class="eyebrow">待处理</p>
            <h3>{{ activeCount }}</h3>
          </article>
          <article class="metric-card metric-danger">
            <p class="eyebrow">高关注</p>
            <h3>{{ riskCount }}</h3>
          </article>
          <article class="metric-card">
            <p class="eyebrow">留有联系方式</p>
            <h3>{{ contactCount }}</h3>
          </article>
        </div>

        <t-space class="toolbar" break-line>
          <t-button :theme="activeStatus === 'all' ? 'primary' : 'default'" :variant="activeStatus === 'all' ? 'base' : 'outline'" @click="activeStatus = 'all'">全部</t-button>
          <t-button
            v-for="status in ['new', 'viewed', 'noted', 'closed', 'withdrawn', 'spam']"
            :key="status"
            :theme="activeStatus === status ? 'primary' : 'default'"
            :variant="activeStatus === status ? 'base' : 'outline'"
            @click="activeStatus = status"
          >
            {{ requestStatusLabels[status as keyof typeof requestStatusLabels] }}
          </t-button>
        </t-space>

        <p v-if="loading" class="muted">正在同步预约池...</p>
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
              <p class="eyebrow pii-line"><LockOnIcon size="14px" /> {{ item.preferredName || "预约记录" }}</p>
              <h3>{{ requestStatusLabels[item.status] }}</h3>
              <p>{{ item.counselorName || "未关联咨询师" }}</p>
              <p>{{ new Date(item.slotStartTime || item.createdAt).toLocaleString() }}</p>
              <p class="request-meta">
                <t-tag v-if="item.assessmentRiskLevel" :theme="item.assessmentRiskLevel === 'high' ? 'danger' : 'primary'" variant="light">
                  {{ assessmentRiskLabels[item.assessmentRiskLevel] }}
                </t-tag>
                <t-tag theme="success" variant="light"><LockOnIcon size="13px" /> {{ item.contactEmail || item.contactNote ? "Encrypted Contact" : "Encrypted" }}</t-tag>
              </p>
            </div>
            <t-tag :theme="item.abuseStatus === 'spam' ? 'danger' : 'default'" variant="light">{{ item.abuseStatus === "spam" ? "垃圾" : "隐私保护" }}</t-tag>
          </article>

          <p v-if="!loading && visibleRequests.length === 0" class="empty-card">当前没有符合条件的预约。</p>
        </div>
      </section>

      <section class="detail-panel" v-if="selected">
        <p class="eyebrow">预约详情</p>
        <h2>{{ selected.preferredName || "预约记录" }}</h2>
        <t-tag theme="success" variant="light"><LockOnIcon size="14px" /> End-to-End Encrypted</t-tag>
        <p class="muted">预约编号 {{ selected.id }}</p>
        <p class="muted">咨询师：{{ selected.counselorName || "未关联" }}</p>
        <p v-if="selected.assessmentRiskLevel" class="muted">关联测评：{{ assessmentRiskLabels[selected.assessmentRiskLevel] }}</p>
        <p>{{ selected.remark || "未填写补充说明" }}</p>
        <div class="contact-box">
          <t-button variant="outline" @click="revealContact = !revealContact">
            {{ revealContact ? "隐藏联系方式" : "查看可选联系方式" }}
          </t-button>
          <p v-if="revealContact">{{ selected.contactEmail || selected.contactNote || "未留下联系方式" }}</p>
        </div>
        <t-space class="action-row" break-line>
          <t-button @click="changeStatus(selected, 'viewed')">已查看</t-button>
          <t-button theme="primary" @click="changeStatus(selected, 'noted')">确认</t-button>
          <t-button variant="outline" @click="changeStatus(selected, 'closed')">关闭</t-button>
          <t-button theme="danger" @click="changeStatus(selected, 'spam')">标记垃圾</t-button>
        </t-space>
        <h3>事件记录</h3>
        <ul class="event-list">
          <li v-for="event in events" :key="event.id">
            {{ new Date(event.createdAt).toLocaleString() }} · {{ event.eventType }}
          </li>
        </ul>
      </section>

      <section class="detail-panel empty-detail" v-else>
        <p class="eyebrow">预约详情</p>
        <h2>选择一条预约</h2>
        <p class="muted">详情、联系方式和事件记录会在这里展示。</p>
      </section>
    </div>
  </AdminShell>
</template>
