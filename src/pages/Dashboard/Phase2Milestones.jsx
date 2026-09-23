import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../api";
import "./Phase2.css";

const STATUS_LABEL = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_ICON = {
  pending: "🕐",
  in_progress: "🔄",
  completed: "✅",
};

const CATEGORY_OPTIONS = [
  "General",
  "Physical",
  "Vitals",
  "Medication",
  "Mental",
  "Diet",
];

/**
 * Phase-2 — Recovery Milestones Timeline.
 *
 * Patient mode:      renders a vertical timeline, patient can move a
 *                    milestone pending -> in_progress -> completed.
 * Doctor mode:       renders a connected-patient selector plus a
 *                    create form; the doctor can also delete and
 *                    update milestone status.
 */
export default function Phase2Milestones({ userId, doctorId, isDoctor }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const patientId = isDoctor ? selectedPatientId : userId;

  useEffect(() => {
    if (!isDoctor) {
      setSelectedPatientId(userId || null);
      return;
    }
    if (!doctorId) return;
    fetch(`${API_BASE}/api/doctor/${doctorId}/patients`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.patients) ? data.patients : [];
        setPatients(list);
        if (list[0]) setSelectedPatientId(list[0].id);
      })
      .catch(() => setPatients([]));
  }, [isDoctor, doctorId, userId]);

  const loadMilestones = (pid) => {
    if (!pid) {
      setMilestones([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/milestones/patient/${pid}`)
      .then((r) => r.json())
      .then((data) => {
        setMilestones(Array.isArray(data.milestones) ? data.milestones : []);
        setLoading(false);
      })
      .catch(() => {
        setMilestones([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMilestones(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const counts = useMemo(
    () => ({
      total: milestones.length,
      inProgress: milestones.filter((m) => m.status === "in_progress").length,
      completed: milestones.filter((m) => m.status === "completed").length,
    }),
    [milestones]
  );

  const handleCreate = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isDoctor) return;
    setSubmitting(true);
    fetch(`${API_BASE}/api/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: selectedPatientId,
        doctor_id: doctorId,
        title: form.title,
        description: form.description,
        category: form.category,
        due_date: form.due_date || null,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSubmitting(false);
        if (!rOk(data)) {
          setError(data.message || "Failed to create milestone");
          return;
        }
        setSuccess(`Milestone "${form.title}" added.`);
        setForm({ title: "", description: "", category: "General", due_date: "" });
        setShowForm(false);
        loadMilestones(selectedPatientId);
      })
      .catch((err) => {
        setSubmitting(false);
        setError(err.message || "Failed to create milestone");
      });
  };

  const rOk = (data) => !data.error && !data.message?.startsWith?.("error");

  const updateStatus = (milestone, nextStatus) => {
    fetch(`${API_BASE}/api/milestones/${milestone.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.milestone) {
          setMilestones((prev) =>
            prev.map((m) => (m.id === milestone.id ? data.milestone : m))
          );
        }
      })
      .catch(() => {});
  };

  const handleDelete = (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.title}"?`)) return;
    fetch(`${API_BASE}/api/milestones/${milestone.id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then(() => loadMilestones(patientId))
      .catch(() => {});
  };

  const formatDate = (d) => (d ? String(d).slice(0, 10) : "—");

  const nextStatus = (status) =>
    status === "pending" ? "in_progress" : status === "in_progress" ? "completed" : null;

  const nextLabel = (status) =>
    status === "pending" ? "Start" : status === "in_progress" ? "Mark Complete" : null;

  return (
    <div className="page-stack">
      <div className="p2-card">
        <div className="p2-card-head">
          <span>🏁</span>
          <div>
            <h3>Recovery Milestones Timeline</h3>
            <p>
              {isDoctor
                ? "Create and manage recovery milestones for your patients."
                : "Track the checkpoints on your road to recovery."}
            </p>
          </div>
        </div>

        {isDoctor && patients.length > 0 && (
          <div className="p2-selector">
            <label>Patient</label>
            <select
              value={selectedPatientId || ""}
              onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.recovery_type ? `— ${p.recovery_type}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p2-card">
        <div className="p2-summary">
          <div className="p2-summary-chip">
            <strong>{counts.total}</strong>
            <span>Total</span>
          </div>
          <div className="p2-summary-chip">
            <strong>{counts.inProgress}</strong>
            <span>In Progress</span>
          </div>
          <div className="p2-summary-chip">
            <strong>{counts.completed}</strong>
            <span>Completed</span>
          </div>
        </div>

        {isDoctor && (
          <div className="p2-toolbar">
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "✕ Cancel" : "+ New Milestone"}
            </button>
          </div>
        )}

        {showForm && isDoctor && (
          <form className="p2-form" onSubmit={handleCreate}>
            <div className="p2-form-grid">
              <label>
                Milestone title
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Walk 500m without pain"
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Target date
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </label>
            </div>
            <label>
              Description
              <textarea
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What should the patient achieve?"
              />
            </label>
            {error && <div className="p2-error">{error}</div>}
            {success && <div className="p2-success">{success}</div>}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Milestone"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="p2-empty">Loading milestones...</p>
        ) : milestones.length === 0 ? (
          <p className="p2-empty">
            No milestones yet.
            {isDoctor ? " Use the button above to add the first one." : ""}
          </p>
        ) : (
          <div className="p2-timeline">
            {milestones.map((m) => {
              const next = nextStatus(m.status);
              return (
                <div className={`p2-timeline-item status-${m.status}`} key={m.id}>
                  <span className="p2-timeline-dot" />
                  <div className="p2-timeline-body">
                    <h4>
                      {STATUS_ICON[m.status] || "•"} {m.title}
                    </h4>
                    {m.description && <p>{m.description}</p>}
                    <div className="p2-meta-row">
                      <span className={`p2-badge ${m.status}`}>
                        {STATUS_LABEL[m.status] || m.status}
                      </span>
                      <span>📁 {m.category || "General"}</span>
                      <span>🗓 Due: {formatDate(m.due_date)}</span>
                      {m.doctor_name && isDoctor && <span>👩‍⚕️ {m.doctor_name}</span>}
                    </div>

                    {!isDoctor && next && (
                      <div className="p2-actions">
                        <button type="button" onClick={() => updateStatus(m, next)}>
                          {next === "in_progress" ? "▶ Start" : "✓ Mark Complete"}
                        </button>
                      </div>
                    )}

                    {isDoctor && (
                      <div className="p2-actions">
                        {next && (
                          <button type="button" onClick={() => updateStatus(m, next)}>
                            {nextLabel(m.status)}
                          </button>
                        )}
                        {m.status === "completed" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(m, "in_progress")}
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          className="p2-delete"
                          type="button"
                          onClick={() => handleDelete(m)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}