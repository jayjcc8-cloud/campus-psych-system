import { publicConfigFixture } from "@campus-psych/domain";
import { useEffect, useState } from "react";
import { useAdminSync, useAdminSyncVersion } from "../features/admin-sync";
import { getPublicConfig, updatePublicConfig } from "../lib/api";

export function ConfigPage() {
  const { publish } = useAdminSync();
  const configVersion = useAdminSyncVersion("configs");
  const [config, setConfig] = useState(publicConfigFixture);
  const [form, setForm] = useState(publicConfigFixture);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadConfig() {
    setLoading(true);
    setError(null);

    try {
      const nextConfig = await getPublicConfig();
      setConfig(nextConfig);
      setForm(nextConfig);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load system config.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfig();
  }, [configVersion]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updatedConfig = await updatePublicConfig(form);
      setConfig(updatedConfig);
      setForm(updatedConfig);
      publish(["configs", "audit-logs"]);
      setNotice("Public configuration saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">System</p>
        <h2>Config center</h2>
        <p>These are the first admin-managed settings called out in the PRD.</p>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {notice ? <p className="banner success">{notice}</p> : null}

      <section className="panel">
        <div className="panel-header">
          <h3>Public content</h3>
          <button className="secondary-button" type="button" onClick={() => void loadConfig()}>
            Refresh
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field field-wide">
            <span>Announcement</span>
            <textarea
              className="text-area"
              value={form.announcement}
              rows={3}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  announcement: event.target.value
                }))
              }
            />
          </label>

          <label className="field field-wide">
            <span>Booking policy</span>
            <textarea
              className="text-area"
              value={form.bookingPolicy}
              rows={3}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bookingPolicy: event.target.value
                }))
              }
            />
          </label>

          <label className="field field-checkbox">
            <input
              type="checkbox"
              checked={form.forceStudentIdBinding}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  forceStudentIdBinding: event.target.checked
                }))
              }
            />
            <span>Force student ID binding</span>
          </label>

          <div className="field field-wide">
            <span>Emergency contacts</span>
            <div className="contact-editor">
              {form.emergencyContacts.map((contact, index) => (
                <div className="inline-fields" key={`${contact.label}-${index}`}>
                  <input
                    className="text-input"
                    placeholder="Label"
                    value={contact.label}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        emergencyContacts: current.emergencyContacts.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: event.target.value } : item
                        )
                      }))
                    }
                  />
                  <input
                    className="text-input"
                    placeholder="Phone"
                    value={contact.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        emergencyContacts: current.emergencyContacts.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, phone: event.target.value } : item
                        )
                      }))
                    }
                  />
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        emergencyContacts: current.emergencyContacts.filter((_, itemIndex) => itemIndex !== index)
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  emergencyContacts: [
                    ...current.emergencyContacts,
                    {
                      label: "",
                      phone: ""
                    }
                  ]
                }))
              }
            >
              Add contact
            </button>
          </div>

          <div className="form-actions field-wide">
            <button className="primary-button" type="submit" disabled={saving || loading}>
              {saving ? "Saving..." : "Save configuration"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h3>Persisted snapshot</h3>
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
    </section>
  );
}
