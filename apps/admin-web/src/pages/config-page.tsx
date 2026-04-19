import { publicConfigFixture } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { getPublicConfig } from "../lib/api";

export function ConfigPage() {
  const [config, setConfig] = useState(publicConfigFixture);

  useEffect(() => {
    void getPublicConfig()
      .then(setConfig)
      .catch(() => {
        return;
      });
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">System</p>
        <h2>Config center</h2>
        <p>These are the first admin-managed settings called out in the PRD.</p>
      </header>

      <section className="panel">
        <h3>Public content</h3>
        <dl className="config-grid">
          <div>
            <dt>Announcement</dt>
            <dd>{config.announcement}</dd>
          </div>
          <div>
            <dt>Booking policy</dt>
            <dd>{config.bookingPolicy}</dd>
          </div>
          <div>
            <dt>Force student ID binding</dt>
            <dd>{config.forceStudentIdBinding ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h3>Emergency contacts</h3>
        <ul className="simple-list">
          {config.emergencyContacts.map((item) => (
            <li key={item.phone}>
              {item.label}: {item.phone}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
