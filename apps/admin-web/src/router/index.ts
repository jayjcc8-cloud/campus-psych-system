import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "../api/client";
import AssessmentStatsPage from "../pages/AssessmentStatsPage.vue";
import AuditLogsPage from "../pages/AuditLogsPage.vue";
import CounselorReviewsPage from "../pages/CounselorReviewsPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RequestsPage from "../pages/RequestsPage.vue";
import SlotsPage from "../pages/SlotsPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginPage },
    { path: "/", component: DashboardPage },
    { path: "/requests", component: RequestsPage },
    { path: "/counselor-reviews", component: CounselorReviewsPage },
    { path: "/assessment-stats", component: AssessmentStatsPage },
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
