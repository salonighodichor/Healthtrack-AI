import { useEffect, useState } from "react";
import { API_BASE } from "../../api";
import "./Phase2.css";

const MOODS = [
  { key: "great", emoji: "😄", label: "Great", score: 5 },
  { key: "good", emoji: "🙂", label: "Good", score: 4 },
  { key: "okay", emoji: "😐", label: "Okay", score: 3 },
  { key: "low", emoji: "😔", label: "Low", score: 2 },
  { key: "poor", emoji: "😞", label: "Poor", score: 1 },
];

const SYMPTOM_OPTIONS = [
  "Pain",
  "Fatigue",
  "Headache",
  "Nausea",
  "Dizziness",
  "Fever",
  "Breathing Difficulty",
  "Appetite Loss",
  "Trouble Sleeping",
];

/**
 * Phase-2 — Health Journal.
 *
 * Patient mode:  create/update today's entry (mood, symptoms, sleep,
 *                notes) and browse past entries.
 * Doctor mode:   pick a connected patient and read their journal.
 */
export default function Phase2Journal({ userId, doctorId, isDoctor }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    mood: "good",
    mood_score: 4,
    sleep_hours: "",
    symptoms: [],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
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

  const loadEntries = (pid) => {
    if (!pid) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/journal/${pid}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEntries(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const chooseMood = (mood) =>
    setForm((prev) => ({ ...prev, mood: mood.key, mood_score: mood.score }));

  const toggleSymptom = (symptom) =>
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));

  const handleSave = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    fetch(`${API_BASE}/api/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        date: form.date,
        mood: form.mood,
        mood_score: form.mood_score,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        symptoms: form.symptoms.join(", "),
        notes: form.notes,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setSaving(false);
        if (data.entry) {
          setSuccess(`Journal saved for ${form.date}.`);
          setForm((prev) => ({ ...prev, notes: "", symptoms: [] }));
        } else {
          setError(data.message || "Failed to save journal");
        }
        loadEntries(userId);
      })
      .catch((err) => {
        setSaving(false);
        setError(err.message || "Failed to save journal");
      });
  };

  const moodEmoji = (key) =>
    (MOODS.find((m) => m.key === key) || {}).emoji || "–";

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m, day] = String(d).split("-");
    if (!y || !m || !day) return d;
    const dateObj = new Date(y, m - 1, day);
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="page-stack">
      <div className="p2-card">
        <div className="p2-card-head">
          <span>📓</span>
          <div>
            <h3>Health Journal</h3>
            <p>
              {isDoctor
                ? "Review your patients' daily journal entries."
                : "Log how you feel every day — mood, symptoms and notes."}
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

      {!isDoctor && (
        <div className="p2-card">
          <div className="p2-card-head">
            <span>✏️</span>
            <div>
              <h3>New Journal Entry</h3>
              <p>Record today's mood, symptoms and any notes.</p>
            </div>
          </div>

          <form className="p2-form" onSubmit={handleSave} style={{ marginTop: 12 }}>
            <div className="p2-form-grid">
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label>
                Sleep (hours)
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={form.sleep_hours}
                  onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })}
                  placeholder="e.g. 7.5"
                />
              </label>
            </div>

            <label style={{ marginBottom: 6 }}>Mood</label>
            <div className="p2-mood-row">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`p2-mood-btn ${form.mood === m.key ? "selected" : ""}`}
                  onClick={() => chooseMood(m)}
                >
                  <span className="p2-mood-emoji">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <label style={{ margin: "14px 0 6px", display: "block" }}>
              Symptoms
            </label>
            <div className="p2-symptom-chips">
              {SYMPTOM_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`p2-symptom-chip ${
                    form.symptoms.includes(s) ? "selected" : ""
                  }`}
                  onClick={() => toggleSymptom(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <label style={{ margin: "14px 0 6px", display: "block" }}>
              Notes
            </label>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything you want to remember about today..."
            />

            {error && <div className="p2-error">{error}</div>}
            {success && <div className="p2-success">{success}</div>}

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
              style={{ marginTop: 12 }}
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>
      )}

      <div className="p2-card">
        <div className="p2-card-head">
          <span>🗓</span>
          <div>
            <h3>{isDoctor ? "Journal Entries" : "Past Entries"}</h3>
            <p>Your journal history, newest first.</p>
          </div>
        </div>

        <div className="p2-journal-list">
          {loading ? (
            <p className="p2-empty">Loading journal entries...</p>
          ) : entries.length === 0 ? (
            <p className="p2-empty">No journal entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div className="p2-journal-entry" key={entry.id}>
                <div className="p2-journal-entry-head">
                  <strong>
                    {moodEmoji(entry.mood)} {formatDate(entry.date)}
                  </strong>
                  <span>
                    Mood {entry.mood_score ?? "–"}/5 · Sleep{" "}
                    {entry.sleep_hours != null ? `${entry.sleep_hours}h` : "–"}
                  </span>
                </div>
                {entry.symptoms && (
                  <div style={{ marginTop: 6 }}>
                    {entry.symptoms
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => (
                        <span className="p2-tag" key={s}>
                          {s}
                        </span>
                      ))}
                  </div>
                )}
                {entry.notes && (
                  <p style={{ fontSize: 13, margin: "8px 0 0", color: "#4b5563" }}>
                    {entry.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}