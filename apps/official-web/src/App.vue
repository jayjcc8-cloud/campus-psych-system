<template>
  <main class="site-shell">
    <SiteHeader :active-page="activePage" @change="setActivePage" />

    <Transition name="page" mode="out-in">
      <component :is="activeComponent" :key="activePage" @navigate="setActivePage" />
    </Transition>

    <footer class="site-footer">
      <div class="footer-brand">
        <span class="brand-mark">心</span>
        <div>
          <strong>心理支持预约系统</strong>
          <p>官网用于了解服务，具体操作请在小程序中完成。</p>
        </div>
      </div>
      <div class="footer-links" aria-label="页脚导航">
        <button v-for="item in footerItems" :key="item.key" @click="setActivePage(item.key)">
          {{ item.label }}
        </button>
      </div>
      <p class="footer-note">本网站不提供医疗诊断或治疗建议。如有即时危险，请联系当地急救或报警资源。</p>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import SiteHeader from "./components/SiteHeader.vue";
import CenterPage from "./pages/CenterPage.vue";
import DemoPage from "./pages/DemoPage.vue";
import HomePage from "./pages/HomePage.vue";
import MiniProgramPage from "./pages/MiniProgramPage.vue";
import PrivacyPage from "./pages/PrivacyPage.vue";
import ProcessPage from "./pages/ProcessPage.vue";
import { navItems, pageKeys, type PageKey } from "./content";

const pageMap = {
  home: HomePage,
  center: CenterPage,
  process: ProcessPage,
  privacy: PrivacyPage,
  demo: DemoPage,
  miniapp: MiniProgramPage
};

const activePage = ref<PageKey>("home");
const footerItems = navItems.filter((item) => item.key !== "home");
const activeComponent = computed(() => pageMap[activePage.value]);

function normalizeHash(hash: string): PageKey {
  const key = hash.replace(/^#\/?/, "") as PageKey;
  return pageKeys.includes(key) ? key : "home";
}

function setActivePage(page: PageKey) {
  activePage.value = page;
  const nextHash = `#${page}`;
  if (window.location.hash !== nextHash) {
    window.history.pushState(null, "", nextHash);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncFromHash() {
  activePage.value = normalizeHash(window.location.hash);
}

onMounted(() => {
  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("popstate", syncFromHash);
});

onUnmounted(() => {
  window.removeEventListener("hashchange", syncFromHash);
  window.removeEventListener("popstate", syncFromHash);
});
</script>
