import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../layouts/app-shell";
import { AppointmentsPage } from "../pages/appointments-page";
import { ConfigPage } from "../pages/config-page";
import { DashboardPage } from "../pages/dashboard-page";
import { RisksPage } from "../pages/risks-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "appointments", element: <AppointmentsPage /> },
      { path: "risks", element: <RisksPage /> },
      { path: "config", element: <ConfigPage /> }
    ]
  }
]);

