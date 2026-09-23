import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../api";
import "./Phase2.css";

const SEVERITY_ICON = {
  severe: "🚨",
  moderate: "⚠️",
  mild: "ℹ️",
};

/**
 * Phase-2 — Medication Interaction Checker (independent module).
 *
 * Does not read from or write to the existing Medicine system. The
 * caller supplies medicine names; rules live in their own table. When
 * a userId is provided, the patient's current prescriptions are offered
 * as quick-select chips and severe findings raise an Alert.
 */
export default function Phase2MedicineChecker({ userId }) {
  const [prescribed, setPrescribed] = useState([]);
  const [selected, setSelected] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/medicines/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        const meds = Array.isArray(data.medicines) ? data.medicines : [];
        const names = meds
          .map((m) => (m.name || "").trim())
          .filter(Boolean);
        setPrescribed(names);
        setSelected((prev) => {
          const merged = [...prev];
          names.forEach((n) => {
            if (!merged.some((x) => x.toLowerCase() === n.toLowerCase())) {
              merged.push(n);
            }
          });
          return merged;
        });
      })
      .catch(() => setPrescribed([]));
  }, [userId]);

  const toggleMedicine = (name) =>
    setSelected((prev) =>
      prev.some((x) => x.toLowerCase() === name.toLowerCase())
        ? prev.filter((x) => x.toLowerCase() !== name.toLowerCase())
        : [...prev, name]
    );

  const addCustom = () => {
    const value = customInput.trim();
    if (!value) return;
    setSelected((prev) =>
      prev.some((x) => x.toLowerCase() === value.toLowerCase())
        ? prev
        : [...prev, value]
    );
    setCustomInput("");
  };

  const removeMedicine = (name) =>
    setSelected((prev) => prev.filter((x) => x.toLowerCase() !== name.toLowerCase()));

  const runCheck = () => {
    setError("");
    setResult(null);
    if (selected.length < 2) {
      setError("Select or add at least two medicines to run a check.");
      return;
    }
    setChecking(true);
    fetch(`${API_BASE}/api/interactions/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId || null, medicines: selected }),
    })
      .then((r) => r.json())
      .then((data) => {
        setChecking(false);
        if (Array.isArray(data.checked)) {
          setResult(data);
        } else {
          setError(data.message || "Unable to check interactions right now.");
        }
      })
      .catch((err) => {
        setChecking(false);
        setError(err.message || "Unable to check interactions right now.");
      });
  };

  const severityOrder = useMemo(
    () => (result?.findings || []).slice().sort((a, b) => {
      const rank = { severe: 0, moderate: 1, mild: 2 };
      return (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3);
    }),
    [result]
  );

  return (
    <div className="page-stack">
      <div className="p2-card">
        <div className="p2-card-head">
          <span>⚗️</span>
          <div>
            <h3>Medication Interaction Checker</h3>
            <p>
              Check your medicine combinations for risky interactions. This tool
              is independent and does not change your prescriptions.
            </p>
          </div>
        </div>

        {prescribed.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Your current prescriptions
            </div>
            <div className="p2-med-chips">
              {prescribed.map((name) => {
                const active = selected.some(
                  (x) => x.toLowerCase() === name.toLowerCase()
                );
                return (
                  <span
                    key={name}
                    className={`p2-med-chip ${active ? "selected" : ""}`}
                    onClick={() => toggleMedicine(name)}
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 600, margin: "14px 0 6px" }}>
          Medicines to check
        </div>

        {selected.length === 0 && prescribed.length === 0 && (
          <p className="p2-empty" style={{ margin: "0 0 10px" }}>
            No medicines loaded. Add a medicine below to begin.
          </p>
        )}

        <div className="p2-med-chips">
          {selected.map((name) => (
            <span
              key={`sel-${name}`}
              className="p2-med-chip selected"
              onClick={() => removeMedicine(name)}
            >
              {name} <button type="button" aria-label={`Remove ${name}`}>×</button>
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add a medicine (e.g. Paracetamol)"
            style={{
              flex: "1 1 220px",
              padding: "9px 11px",
              border: "1px solid #d7dce5",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <button className="outline-button" type="button" onClick={addCustom}>
            + Add
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={runCheck}
            disabled={checking || selected.length < 2}
          >
            {checking ? "Checking..." : "🔍 Check Interactions"}
          </button>
        </div>

        {error && <div className="p2-error">{error}</div>}
      </div>

      {result && (
        <div className="p2-card">
          <div className="p2-card-head">
            <span>📋</span>
            <div>
              <h3>Check Results</h3>
              <p>
                Checked {result.checked.length} medicine
                {result.checked.length !== 1 ? "s" : ""} —{" "}
                {result.findings.length} interaction
                {result.findings.length !== 1 ? "s" : ""} found.
              </p>
            </div>
          </div>

          <div className="p2-findings">
            {result.findings.length === 0 ? (
              <div className="p2-safe-box">
                ✅ No known interactions found between the selected medicines.
              </div>
            ) : (
              severityOrder.map((f, idx) => (
                <div className={`p2-finding ${f.severity}`} key={`${f.medicine_a}-${f.medicine_b}-${idx}`}>
                  <span className="p2-finding-icon">
                    {SEVERITY_ICON[f.severity] || "⚠️"}
                  </span>
                  <div className="p2-finding-body">
                    <strong>
                      {f.medicine_a} + {f.medicine_b}
                      <span className={`p2-finding-severity p2-severity-${f.severity}`}>
                        {f.severity}
                      </span>
                    </strong>
                    <p>{f.warning}</p>
                    {f.recommendation && (
                      <p style={{ color: "#2b6de0", marginTop: 4 }}>
                        💡 {f.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {result.safe && result.safe.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                No known issues with
              </div>
              <div className="p2-med-chips">
                {result.safe.map((name) => (
                  <span className="p2-med-chip" key={`safe-${name}`}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}