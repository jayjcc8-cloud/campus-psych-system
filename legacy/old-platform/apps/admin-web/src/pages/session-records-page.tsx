import {
  appointmentsFixture,
  auditLogsFixture,
  risksFixture,
  sessionRecordsFixture,
  type AuditLog,
  type EmotionLevel,
  type IssueType,
  type RiskLevel
} from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { useAdminSync, useAdminSyncVersion } from "../features/admin-sync";
import {
  createSessionRecord,
  getAppointments,
  getAuditLogs,
  getRiskFlags,
  getSessionRecords
} from "../lib/api";

const emotionLevels: EmotionLevel[] = [1, 2, 3, 4, 5];
const issueTypes: IssueType[] = [
  "academic_pressure",
  "sleep",
  "relationship",
  "emotion",
  "career",
  "other"
];
const riskLevels: RiskLevel[] = ["low", "medium", "high"];

export function SessionRecordsPage() {
  const { publish } = useAdminSync();
  const riskVersion = useAdminSyncVersion("risks");
  const auditLogVersion = useAdminSyncVersion("audit-logs");
  const [records, setRecords] = useState(sessionRecordsFixture);
  const [appointments, setAppointments] = useState(appointmentsFixture);
  const [linkedRisks, setLinkedRisks] = useState(risksFixture);
  const [linkedAuditLogs, setLinkedAuditLogs] = useState<AuditLog[]>(auditLogsFixture);
  const [loading, setLoading] = useState(true);
  const [linkedLoading, setLinkedLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    appointmentId: appointmentsFixture[0]?.id ?? "",
    issueType: "academic_pressure" as IssueType,
    emotionLevel: 3 as EmotionLevel,
    riskLevel: "low" as RiskLevel,
    needFollowUp: false,
    summaryNote: "",
    privateNote: ""
  });

  async function loadSessionRecords() {
    setLoading(true);
    setError(null);

    try {
      const [recordsResponse, appointmentsResponse] = await Promise.all([
        getSessionRecords(),
        getAppointments()
      ]);

      setRecords(recordsResponse);
      setAppointments(appointmentsResponse);
      setForm((current) => ({
        ...current,
        appointmentId: current.appointmentId || appointmentsResponse[0]?.id || ""
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load session records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessionRecords();
  }, []);

  async function loadLinkedData(appointmentId: string) {
    setLinkedLoading(true);

    try {
      const [risksResponse, auditLogsResponse] = await Promise.all([getRiskFlags(), getAuditLogs()]);

      setLinkedRisks(
        risksResponse.filter((risk) => !appointmentId || risk.appointmentId === appointmentId).slice(0, 5)
      );
      setLinkedAuditLogs(
        auditLogsResponse
          .filter((log) =>
            ["session_record", "risk_flag"].includes(log.targetType) ||
            log.targetId === appointmentId
          )
          .slice(0, 6)
      );
    } catch {
      setLinkedRisks([]);
      setLinkedAuditLogs([]);
    } finally {
      setLinkedLoading(false);
    }
  }

  useEffect(() => {
    void loadLinkedData(form.appointmentId);
  }, [form.appointmentId, riskVersion, auditLogVersion]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const createdRecord = await createSessionRecord({
        appointmentId: form.appointmentId,
        issueType: form.issueType,
        emotionLevel: form.emotionLevel,
        riskLevel: form.riskLevel,
        needFollowUp: form.needFollowUp,
        summaryNote: form.summaryNote,
        privateNote: form.privateNote || undefined
      });

      setRecords((current) => [createdRecord, ...current]);
      setForm((current) => ({
        ...current,
        summaryNote: "",
        privateNote: ""
      }));
      publish(["session-records", "risks", "audit-logs", "overview"]);
      await loadLinkedData(createdRecord.appointmentId);
      setNotice(`Session record ${createdRecord.id} created and persisted.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create session record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Records</p>
        <h2>Session records</h2>
        <p>Create structured notes against appointments and trigger downstream risk workflows through the live API.</p>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {notice ? <p className="banner success">{notice}</p> : null}

      <section className="panel form-panel">
        <div className="panel-header">
          <h3>Create session record</h3>
          <button className="secondary-button" type="button" onClick={() => void loadSessionRecords()}>
            Refresh
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Appointment</span>
            <select
              className="select-input"
              value={form.appointmentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  appointmentId: event.target.value
                }))
              }
            >
              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.id} / {appointment.status}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Issue type</span>
            <select
              className="select-input"
              value={form.issueType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  issueType: event.target.value as IssueType
                }))
              }
            >
              {issueTypes.map((issueType) => (
                <option key={issueType} value={issueType}>
                  {issueType}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Emotion level</span>
            <select
              className="select-input"
              value={form.emotionLevel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  emotionLevel: Number(event.target.value) as EmotionLevel
                }))
              }
            >
              {emotionLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Risk level</span>
            <select
              className="select-input"
              value={form.riskLevel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  riskLevel: event.target.value as RiskLevel
                }))
              }
            >
              {riskLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="field field-checkbox">
            <input
              type="checkbox"
              checked={form.needFollowUp}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  needFollowUp: event.target.checked
                }))
              }
            />
            <span>Follow-up required</span>
          </label>

          <label className="field field-wide">
            <span>Summary note</span>
            <textarea
              className="text-area"
              value={form.summaryNote}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  summaryNote: event.target.value
                }))
              }
              rows={4}
              required
            />
          </label>

          <label className="field field-wide">
            <span>Private note</span>
            <textarea
              className="text-area"
              value={form.privateNote}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  privateNote: event.target.value
                }))
              }
              rows={3}
            />
          </label>

          <div className="form-actions field-wide">
            <button className="primary-button" type="submit" disabled={submitting || !form.appointmentId}>
              {submitting ? "Creating..." : "Create record"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Recent records</h3>
        <div className="stack">
          {loading ? <p>Loading session records...</p> : null}
          {records.map((record) => (
            <article className="stack-card" key={record.id}>
              <div className="stack-card-header">
                <h4>{record.id}</h4>
                <span className="pill-label">{record.riskLevel}</span>
              </div>
              <p>Appointment: {record.appointmentId}</p>
              <p>Issue: {record.issueType}</p>
              <p>Emotion level: {record.emotionLevel}</p>
              <p>Follow-up: {record.needFollowUp ? "Yes" : "No"}</p>
              <p>{record.summaryNote}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="linked-grid">
        <section className="panel">
          <h3>Linked risk flags</h3>
          {linkedLoading ? <p>Refreshing risk follow-up...</p> : null}
          <div className="stack">
            {linkedRisks.map((risk) => (
              <article className="stack-card" key={risk.id}>
                <div className="stack-card-header">
                  <h4>{risk.id}</h4>
                  <span className="pill-label">{risk.level}</span>
                </div>
                <p>Status: {risk.status}</p>
                <p>Assignee: {risk.assignedTo ?? "Unassigned"}</p>
                <p>{risk.triggerReason}</p>
              </article>
            ))}
            {!linkedLoading && linkedRisks.length === 0 ? <p>No linked risk flags for this appointment yet.</p> : null}
          </div>
        </section>

        <section className="panel">
          <h3>Linked audit activity</h3>
          {linkedLoading ? <p>Refreshing audit activity...</p> : null}
          <div className="stack">
            {linkedAuditLogs.map((log) => (
              <article className="stack-card" key={log.id}>
                <div className="stack-card-header">
                  <h4>{log.actionType}</h4>
                  <span className="pill-label">{log.operatorRole}</span>
                </div>
                <p>{new Date(log.createdAt).toLocaleString()}</p>
                <p>
                  {log.targetType} / {log.targetId}
                </p>
                <p>{log.detail ?? "No detail"}</p>
              </article>
            ))}
            {!linkedLoading && linkedAuditLogs.length === 0 ? <p>No linked audit activity yet.</p> : null}
          </div>
        </section>
      </section>
    </section>
  );
}
