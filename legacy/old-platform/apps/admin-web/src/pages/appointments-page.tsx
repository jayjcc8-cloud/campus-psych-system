import { appointmentTransitions, appointmentsFixture, counselorsFixture } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { useAdminSync, useAdminSyncVersion } from "../features/admin-sync";
import { getAppointments, getCounselors, updateAppointmentStatus } from "../lib/api";

export function AppointmentsPage() {
  const { publish } = useAdminSync();
  const appointmentVersion = useAdminSyncVersion("appointments");
  const [appointments, setAppointments] = useState(appointmentsFixture);
  const [counselors, setCounselors] = useState(counselorsFixture);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadAppointments() {
    setLoading(true);
    setError(null);

    try {
      const [appointmentsResponse, counselorsResponse] = await Promise.all([
        getAppointments(),
        getCounselors()
      ]);

      setAppointments(appointmentsResponse);
      setCounselors(counselorsResponse);
      setStatusDrafts(
        Object.fromEntries(appointmentsResponse.map((appointment) => [appointment.id, appointment.status]))
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load appointment workflows.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAppointments();
  }, [appointmentVersion]);

  async function handleStatusSave(appointmentId: string) {
    const nextStatus = statusDrafts[appointmentId];

    if (!nextStatus) {
      return;
    }

    setSavingId(appointmentId);
    setError(null);
    setNotice(null);

    try {
      const updatedAppointment = await updateAppointmentStatus(
        appointmentId,
        nextStatus as (typeof appointments)[number]["status"]
      );

      setAppointments((current) =>
        current.map((appointment) => (appointment.id === appointmentId ? updatedAppointment : appointment))
      );
      setStatusDrafts((current) => ({
        ...current,
        [appointmentId]: updatedAppointment.status
      }));
      publish(["appointments", "audit-logs", "overview"]);
      setNotice(`Appointment ${appointmentId} moved to ${updatedAppointment.status}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update appointment status.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Workflow</p>
        <h2>Appointments</h2>
        <p>Review appointment traffic, adjust state transitions, and verify the persisted booking workflow.</p>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {notice ? <p className="banner success">{notice}</p> : null}

      <section className="panel">
        <div className="panel-header">
          <h3>Appointment queue</h3>
          <button className="secondary-button" type="button" onClick={() => void loadAppointments()}>
            Refresh
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Counselor</th>
              <th>Issue</th>
              <th>Status</th>
              <th>Next step</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading appointments...</td>
              </tr>
            ) : null}
            {appointments.map((appointment) => {
              const counselor = counselors.find(
                (item) => item.id === appointment.counselorId
              );
              const transitions = appointmentTransitions[appointment.status];
              const selectOptions = [appointment.status, ...transitions];

              return (
                <tr key={appointment.id}>
                  <td>{appointment.id}</td>
                  <td>{counselor?.displayName ?? "Unknown"}</td>
                  <td>{appointment.issueEntryType}</td>
                  <td>{appointment.status}</td>
                  <td>
                    <select
                      className="select-input"
                      value={statusDrafts[appointment.id] ?? appointment.status}
                      onChange={(event) =>
                        setStatusDrafts((current) => ({
                          ...current,
                          [appointment.id]: event.target.value
                        }))
                      }
                    >
                      {selectOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={
                        savingId === appointment.id ||
                        (statusDrafts[appointment.id] ?? appointment.status) === appointment.status
                      }
                      onClick={() => void handleStatusSave(appointment.id)}
                    >
                      {savingId === appointment.id ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </section>
  );
}
