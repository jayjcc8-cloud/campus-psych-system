import type { AuditLog } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { useAdminSyncVersion } from "../features/admin-sync";
import { getAuditLogs } from "../lib/api";

export function AuditLogsPage() {
  const auditLogVersion = useAdminSyncVersion("audit-logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAuditLogs() {
    setLoading(true);
    setError(null);

    try {
      setLogs(await getAuditLogs());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAuditLogs();
  }, [auditLogVersion]);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Traceability</p>
        <h2>Audit logs</h2>
        <p>Review who changed appointments, records, risks, and public configuration during live workflow testing.</p>
      </header>

      {error ? <p className="banner error">{error}</p> : null}

      <section className="panel">
        <div className="panel-header">
          <h3>Recent activity</h3>
          <button className="secondary-button" type="button" onClick={() => void loadAuditLogs()}>
            Refresh
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading audit logs...</td>
              </tr>
            ) : null}
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>
                  {log.operatorId}
                  <br />
                  <small>{log.operatorRole}</small>
                </td>
                <td>{log.actionType}</td>
                <td>
                  {log.targetType}
                  <br />
                  <small>{log.targetId}</small>
                </td>
                <td>{log.detail ?? "No detail"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
