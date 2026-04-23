import { appointmentSummaryFixture, overviewMetricsFixture } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { MetricCard } from "../components/metric-card";
import { useAdminSyncVersion } from "../features/admin-sync";
import { getAppointmentSummary, getOverviewMetrics } from "../lib/api";

export function DashboardPage() {
  const overviewVersion = useAdminSyncVersion("overview");
  const [overview, setOverview] = useState(overviewMetricsFixture);
  const [summary, setSummary] = useState(appointmentSummaryFixture);

  useEffect(() => {
    void Promise.allSettled([getOverviewMetrics(), getAppointmentSummary()]).then((results) => {
      const [overviewResult, summaryResult] = results;

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      }

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      }
    });
  }, [overviewVersion]);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Overview</p>
        <h2>MVP command center</h2>
        <p>
          Focus the first release on appointment throughput, counselor workload, and risk follow-up.
        </p>
      </header>

      <div className="metric-grid">
        <MetricCard
          label="Appointments this month"
          value={String(overview.appointmentsThisMonth)}
          hint="Track intake volume and demand."
        />
        <MetricCard
          label="Completed sessions"
          value={String(overview.completedSessionsThisMonth)}
          hint="Measures service delivery throughput."
        />
        <MetricCard
          label="Active risk flags"
          value={String(overview.activeRiskFlags)}
          hint="Needs counselor or admin follow-up."
        />
        <MetricCard
          label="Average lead time"
          value={`${overview.averageLeadTimeHours}h`}
          hint="Time from booking to session slot."
        />
      </div>

      <section className="panel">
        <h3>Appointment status breakdown</h3>
        <div className="status-row">
          <span>Total: {summary.total}</span>
          <span>Pending: {summary.pending}</span>
          <span>Confirmed: {summary.confirmed}</span>
          <span>Completed: {summary.completed}</span>
          <span>Flagged: {summary.flagged}</span>
        </div>
      </section>
    </section>
  );
}
