import { useEffect, useState } from "react";
import { API_BASE } from "../../api";

const MOODS = [
  { value: "great", label: "😄 Great" },
  { value: "ok", label: "🙂 Okay" },
  { value: "low", label: "😔 Low" },
  { value: "poor", label: "😞 Poor" },
];

const moodEmoji = (mood) =>
  ({
    great: "😄",
    ok: "🙂",
    low: "😔",
    poor: "😞",
  }[mood] || "🙂");

/**
 * Phase-1 Core — Daily Health Check-In.
 * Wraps GET /api/daily-checkins/<user_id> and POST /api/daily-checkin
 * (both verified in the Phase-1 backend route suite).
 */
export default function Phase1CheckIn({ userId, onAwarded }) {
  const [form, setForm] = useState({
    sleep_hours: "",
    exercise_minutes: "",
    mood: "ok",
    symptoms: "",
    notes: "",
  });
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadHistory = () => {
    if (!userId) return;
    fetch(`${API_BASE}/api/daily-checkins/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.daily_checkins)
          ? data.daily_checkins
          : Array.isArray(data)
          ? data
          : [];
        setHistory(list);
      })
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    fetch(`${API_BASE}/api/daily-checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        exercise_minutes: form.exercise_minutes
          ? Number(form.exercise_minutes)
          : null,
        mood: form.mood,
        symptoms: form.symptoms,
        notes: form.notes,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSubmitting(false);
        if (data.error) {
          setError(data.error);
          return;
        }
        setSuccess(
          data.points_awarded
            ? `Check-in saved! +${data.points_awarded} points earned.`
            : "Check-in saved!"
        );
        if (onAwarded && data.points_awarded) {
          onAwarded(data.points_awarded, data.total_points);
        }
        setForm({
          sleep_hours: "",
          exercise_minutes: "",
          mood: "ok",
          symptoms: "",
          notes: "",
        });
        loadHistory();
      })
      .catch((err) => {
        setSubmitting(false);
        setError(err.message || "Failed to save check-in");
      });
  };

  return (
    <div className="phase1-card">
      <div className="phase1-card-head">
        <span>📝</span>
        <div>
          <h3>Daily Health Check-In</h3>
          <p>Log how you're feeling today to keep your care team in sync.</p>
        </div>
      </div>

      <form className="phase1-form" onSubmit={handleSubmit}>
        <div className="phase1-form-grid">
          <label>
            Sleep (hours)
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              name="sleep_hours"
              value={form.sleep_hours}
              onChange={handleChange}
              placeholder="e.g. 7.5"
            />
          </label>
          <label>
            Exercise (minutes)
            <input
              type="number"
              min="0"
              max="600"
              step="5"
              name="exercise_minutes"
              value={form.exercise_minutes}
              onChange={handleChange}
              placeholder="e.g. 30"
            />
          </label>
          <label>
            Mood
            <select name="mood" value={form.mood} onChange={handleChange}>
              {MOODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Symptoms
            <input
              type="text"
              name="symptoms"
              value={form.symptoms}
              onChange={handleChange}
              placeholder="headache, nausea, ..."
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            name="notes"
            rows="2"
            value={form.notes}
            onChange={handleChange}
            placeholder="Anything else you'd like to share..."
          />
        </label>

        {error && <div className="phase1-error">{error}</div>}
        {success && <div className="phase1-success">{success}</div>}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Submit Check-In"}
        </button>
      </form>

      {history.length > 0 && (
        <div className="phase1-history">
          <h4>Recent Check-Ins</h4>
          {history.slice(0, 6).map((c) => (
            <div className="phase1-history-row" key={c.id}>
              <span>{moodEmoji(c.mood)}</span>
              <span className="phase1-history-date">{c.checkin_date}</span>
              <span>
                sleep {c.sleep_hours ?? "—"}h · exercise{" "}
                {c.exercise_minutes ?? "—"}m
              </span>
              {c.points_awarded ? (
                <span className="phase1-pts">+{c.points_awarded} pts</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
