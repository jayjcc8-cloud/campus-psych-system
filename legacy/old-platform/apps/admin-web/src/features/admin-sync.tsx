import { createContext, useContext, useMemo, useState } from "react";

type AdminSyncChannel =
  | "appointments"
  | "session-records"
  | "risks"
  | "audit-logs"
  | "configs"
  | "overview";

type AdminSyncContextValue = {
  versions: Record<AdminSyncChannel, number>;
  publish: (channels: AdminSyncChannel[]) => void;
};

const AdminSyncContext = createContext<AdminSyncContextValue | null>(null);

const initialVersions: Record<AdminSyncChannel, number> = {
  appointments: 0,
  "session-records": 0,
  risks: 0,
  "audit-logs": 0,
  configs: 0,
  overview: 0
};

export function AdminSyncProvider({ children }: { children: React.ReactNode }) {
  const [versions, setVersions] = useState(initialVersions);

  const value = useMemo<AdminSyncContextValue>(
    () => ({
      versions,
      publish(channels) {
        setVersions((current) => {
          const next = { ...current };

          channels.forEach((channel) => {
            next[channel] += 1;
          });

          return next;
        });
      }
    }),
    [versions]
  );

  return <AdminSyncContext.Provider value={value}>{children}</AdminSyncContext.Provider>;
}

export function useAdminSync() {
  const context = useContext(AdminSyncContext);

  if (!context) {
    throw new Error("useAdminSync must be used within AdminSyncProvider.");
  }

  return context;
}

export function useAdminSyncVersion(channel: AdminSyncChannel) {
  return useAdminSync().versions[channel];
}
