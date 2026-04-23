import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AdminSyncProvider } from "./features/admin-sync";
import { router } from "./router";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminSyncProvider>
      <RouterProvider router={router} />
    </AdminSyncProvider>
  </React.StrictMode>
);
