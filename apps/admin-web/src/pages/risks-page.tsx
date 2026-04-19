import { risksFixture } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { getRiskFlags } from "../lib/api";

export function RisksPage() {
  const [risks, setRisks] = useState(risksFixture);

  useEffect(() => {
    void getRiskFlags()
      .then((items) => setRisks(items))
      .catch(() => {
        return;
      });
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Safety</p>
        <h2>Risk follow-up</h2>
        <p>The scaffold mirrors the PRD rule that risk labels support workflow and never replace judgment.</p>
      </header>

      <div className="stack">
        {risks.map((risk) => (
          <article className="risk-card" key={risk.id}>
            <div>
              <p className="risk-level">{risk.level.toUpperCase()}</p>
              <h3>{risk.triggerReason}</h3>
            </div>
            <div className="risk-meta">
              <span>Status: {risk.status}</span>
              <span>Assignee: {risk.assignedTo ?? "Unassigned"}</span>
              <span>Follow-up: {risk.nextFollowUpAt ?? "Not set"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
