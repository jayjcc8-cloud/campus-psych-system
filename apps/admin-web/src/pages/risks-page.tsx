import { risksFixture } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { useAdminSync, useAdminSyncVersion } from "../features/admin-sync";
import { getRiskFlags, updateRiskFlag } from "../lib/api";

export function RisksPage() {
  const { publish } = useAdminSync();
  const riskVersion = useAdminSyncVersion("risks");
  const [risks, setRisks] = useState(risksFixture);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        status: string;
        assignedTo: string;
        nextFollowUpAt: string;
      }
    >
  >({});

  async function loadRisks() {
    setLoading(true);
    setError(null);

    try {
      const items = await getRiskFlags();
      setRisks(items);
      setDrafts(
        Object.fromEntries(
          items.map((risk) => [
            risk.id,
            {
              status: risk.status,
              assignedTo: risk.assignedTo ?? "",
              nextFollowUpAt: risk.nextFollowUpAt ? risk.nextFollowUpAt.slice(0, 16) : ""
            }
          ])
        )
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load risk flags.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRisks();
  }, [riskVersion]);

  async function handleSave(riskId: string) {
    const draft = drafts[riskId];
    if (!draft) {
      return;
    }

    setSavingId(riskId);
    setError(null);
    setNotice(null);

    try {
      const updatedRisk = await updateRiskFlag(riskId, {
        status: draft.status as (typeof risks)[number]["status"],
        assignedTo: draft.assignedTo || undefined,
        nextFollowUpAt: draft.nextFollowUpAt ? new Date(draft.nextFollowUpAt).toISOString() : undefined
      });

      setRisks((current) => current.map((risk) => (risk.id === riskId ? updatedRisk : risk)));
      publish(["risks", "audit-logs", "overview"]);
      setNotice(`Risk ${riskId} updated.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update risk.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Safety</p>
        <h2>Risk follow-up</h2>
        <p>The scaffold mirrors the PRD rule that risk labels support workflow and never replace judgment.</p>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {notice ? <p className="banner success">{notice}</p> : null}

      <div className="panel-header">
        <h3>Open risk flags</h3>
        <button className="secondary-button" type="button" onClick={() => void loadRisks()}>
          Refresh
        </button>
      </div>

      <div className="stack">
        {loading ? <p>Loading risk workflows...</p> : null}
        {risks.map((risk) => (
          <article className="risk-card" key={risk.id}>
            <div>
              <p className="risk-level">{risk.level.toUpperCase()}</p>
              <h3>{risk.triggerReason}</h3>
              <p>Student: {risk.studentId}</p>
            </div>
            <div className="risk-meta">
              <label className="field compact-field">
                <span>Status</span>
                <select
                  className="select-input"
                  value={drafts[risk.id]?.status ?? risk.status}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [risk.id]: {
                        ...current[risk.id],
                        status: event.target.value
                      }
                    }))
                  }
                >
                  {["pending", "in_progress", "processed", "closed"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field compact-field">
                <span>Assignee</span>
                <input
                  className="text-input"
                  value={drafts[risk.id]?.assignedTo ?? risk.assignedTo ?? ""}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [risk.id]: {
                        ...current[risk.id],
                        assignedTo: event.target.value
                      }
                    }))
                  }
                />
              </label>

              <label className="field compact-field">
                <span>Follow-up</span>
                <input
                  className="text-input"
                  type="datetime-local"
                  value={drafts[risk.id]?.nextFollowUpAt ?? ""}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [risk.id]: {
                        ...current[risk.id],
                        nextFollowUpAt: event.target.value
                      }
                    }))
                  }
                />
              </label>

              <button
                className="primary-button"
                type="button"
                disabled={savingId === risk.id}
                onClick={() => void handleSave(risk.id)}
              >
                {savingId === risk.id ? "Saving..." : "Save"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
