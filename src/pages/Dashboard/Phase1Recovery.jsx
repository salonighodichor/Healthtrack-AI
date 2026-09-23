import { useEffect, useState } from "react";
import { API_BASE } from "../../api";

/**
 * Phase-1 Core — Doctor Recovery Plans.
 *
 * Wraps GET/POST /api/recovery-plans and GET/POST/DELETE
 * /api/recovery-plans/<plan_id>(/activities|/goals), all verified
 * in the Phase-1 backend route suite.
 *
 * Emits { planId, patientId } on creation so the parent can refresh
 * the Health Score / Gamification panels.
 */
export default function Phase1Recovery({ userId, onPlanCreated }) {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activities, setActivities] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    daily_targets: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPlans = () => {
    if (!userId) return;
    fetch(`${API_BASE}/api/recovery-plans/patient/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.recovery_plans)
          ? data.recovery_plans
          : Array.isArray(data)
          ? data
          : [];
        setPlans(list);
      })
      .catch(() => setPlans([]));
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadPlanDetail = (planId) => {
    if (!planId) return;
    Promise.all([
      fetch(`${API_BASE}/api/recovery-plans/${planId}/activities`).then((r) =>
        r.json()
      ),
      fetch(`${API_BASE}/api/recovery-plans/${planId}/goals`).then((r) =>
        r.json()
      ),
    ])
      .then(([aRes, gRes]) => {
        setActivities(
          Array.isArray(aRes.recovery_activities)
            ? aRes.recovery_activities
            : Array.isArray(aRes)
            ? aRes
            : []
        );
        setGoals(
          Array.isArray(gRes.recovery_goals)
            ? gRes.recovery_goals
            : Array.isArray(gRes)
            ? gRes
            : []
        );
      })
      .catch(() => {
        setActivities([]);
        setGoals([]);
      });
  };

  const handleSelect = (plan) => {
    setSelected(plan);
    loadPlanDetail(plan.id);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    fetch(`${API_BASE}/api/recovery-plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: userId,
        title: form.title,
        description: form.description,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        daily_targets: form.daily_targets
          ? JSON.parse(
              `[${form.daily_targets
                .split(",")
                .map((s) => `"${s.trim()}"`)
                .join(",")}]`
            )
          : [],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSubmitting(false);
        if (data.error) {
          setError(data.error);
          return;
        }
        setSuccess(`Recovery plan "${data.title || form.title}" created!`);
        setForm({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          daily_targets: "",
        });
        setShowForm(false);
        loadPlans();
        if (onPlanCreated) onPlanCreated(data.id || data.plan?.id);
      })
      .catch((err) => {
        setSubmitting(false);
        setError(err.message || "Failed to create plan");
      });
  };

  const handleDelete = (planId) => {
    if (!window.confirm("Delete this recovery plan?")) return;
    fetch(`${API_BASE}/api/recovery-plans/${planId}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setSelected(null);
          setActivities([]);
          setGoals([]);
          loadPlans();
        }
      })
      .catch(() => {});
  };

  const formatDate = (d) => (d ? String(d).slice(0, 10) : "—");

  return (
    <div className="phase1-card">
      <div className="phase1-card-head">
        <span>📋</span>
        <div>
          <h3>Doctor Recovery Plans</h3>
          <p>Structured plans with daily activities and measurable goals.</p>
        </div>
      </div>

      <div className="phase1-toolbar">
        <button
          className="primary-button"
          type="button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "+ New Recovery Plan"}
        </button>
      </div>

      {showForm && (
        <form className="phase1-form" onSubmit={handleCreate}>
          <div className="phase1-form-grid">
            <label>
              Plan Title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Post-Surgery Mobility Plan"
              />
            </label>
            <label>
              Start Date
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </label>
            <label>
              End Date
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
              />
            </label>
            <label>
              Daily Targets (comma separated)
              <input
                type="text"
                name="daily_targets"
                value={form.daily_targets}
                onChange={handleChange}
                placeholder="walk 30m, physio, water 2L"
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              rows="2"
              value={form.description}
              onChange={handleChange}
              placeholder="Briefly describe this recovery plan..."
            />
          </label>
          {error && <div className="phase1-error">{error}</div>}
          {success && <div className="phase1-success">{success}</div>}
          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Plan"}
          </button>
        </form>
      )}

      {plans.length === 0 ? (
        <p className="phase1-empty">No recovery plans yet.</p>
      ) : (
        <div className="phase1-plan-list">
          {plans.map((plan) => (
            <div
              className={`phase1-plan-row ${
                selected && selected.id === plan.id ? "active" : ""
              }`}
              key={plan.id}
              onClick={() => handleSelect(plan)}
            >
              <div className="phase1-plan-main">
                <strong>{plan.title}</strong>
                <span>
                  {formatDate(plan.start_date)} → {formatDate(plan.end_date)}
                </span>
              </div>
              <button
                className="icon-button danger"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(plan.id);
                }}
                title="Delete plan"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="phase1-plan-detail">
          <h4>{selected.title}</h4>
          {selected.description && <p>{selected.description}</p>}

          <div className="phase1-detail-col">
            <h5>📆 Activities</h5>
            {activities.length === 0 ? (
              <p className="phase1-empty">No activities linked yet.</p>
            ) : (
              activities.map((a) => (
                <div className="phase1-task-row" key={a.id}>
                  <span>🔹</span>
                  <span>{a.activity_name}</span>
                  <span className="phase1-meta">
                    {a.frequency ? `${a.frequency}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="phase1-detail-col">
            <h5>🎯 Goals</h5>
            {goals.length === 0 ? (
              <p className="phase1-empty">No goals set yet.</p>
            ) : (
              goals.map((g) => (
                <div className="phase1-task-row" key={g.id}>
                  <span>{g.is_achieved ? "✅" : "⬜"}</span>
                  <span>{g.goal_title}</span>
                  <span className="phase1-meta">
                    target: {g.target_value ?? "—"} {g.unit ?? ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
