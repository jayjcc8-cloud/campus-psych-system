import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../layouts/app-shell";
import { AppointmentsPage } from "../pages/appointments-page";
import { AuditLogsPage } from "../pages/audit-logs-page";
import { ConfigPage } from "../pages/config-page";
import { DashboardPage } from "../pages/dashboard-page";
import { RisksPage } from "../pages/risks-page";
import { SessionRecordsPage } from "../pages/session-records-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "appointments", element: <AppointmentsPage /> },
      { path: "session-records", element: <SessionRecordsPage /> },
      { path: "risks", element: <RisksPage /> },
      { path: "config", element: <ConfigPage /> },
      { path: "audit-logs", element: <AuditLogsPage /> }
    ]
  }
]);
