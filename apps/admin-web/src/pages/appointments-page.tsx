import { appointmentsFixture, counselorsFixture } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { getAppointments } from "../lib/api";

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState(appointmentsFixture);

  useEffect(() => {
    void getAppointments()
      .then(setAppointments)
      .catch(() => {
        return;
      });
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Workflow</p>
        <h2>Appointments</h2>
        <p>Use this page to wire list filters, status actions, and counselor capacity visibility.</p>
      </header>

      <section className="panel">
        <h3>Current fixtures</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Counselor</th>
              <th>Issue</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => {
              const counselor = counselorsFixture.find(
                (item) => item.id === appointment.counselorId
              );

              return (
                <tr key={appointment.id}>
                  <td>{appointment.id}</td>
                  <td>{counselor?.displayName ?? "Unknown"}</td>
                  <td>{appointment.issueEntryType}</td>
                  <td>{appointment.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </section>
  );
}
