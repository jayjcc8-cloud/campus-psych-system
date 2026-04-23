import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "../api/client";
import AuditLogsPage from "../pages/AuditLogsPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RequestsPage from "../pages/RequestsPage.vue";
import SlotsPage from "../pages/SlotsPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginPage },
    { path: "/", component: RequestsPage },
    { path: "/slots", component: SlotsPage },
    { path: "/audit-logs", component: AuditLogsPage }
  ]
});

router.beforeEach((to) => {
  if (to.path !== "/login" && !getToken()) {
    return "/login";
  }

  if (to.path === "/login" && getToken()) {
    return "/";
  }

  return true;
});
