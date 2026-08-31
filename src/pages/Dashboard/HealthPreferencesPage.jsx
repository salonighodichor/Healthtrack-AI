import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./SettingsPage.css";

function HealthPreferencesPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [health, setHealth] = useState({
    bloodGroup: "",
    allergies: "",
    conditions: "",
    emergencyName: "",
    emergencyPhone: "",
    height: "",
    weight: "",
    healthGoal: "General Fitness",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/patient/${userId}/settings`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load health preferences");

        const prefs = data.healthPreferences || {};
        setHealth({
          bloodGroup: prefs.bloodGroup || "",
          allergies: prefs.allergies || "",
          conditions: prefs.conditions || "",
          emergencyName: prefs.emergencyName || "",
          emergencyPhone: prefs.emergencyPhone || "",
          height: prefs.height || "",
          weight: prefs.weight || "",
          healthGoal: prefs.healthGoal || "General Fitness",
        });
      } catch (err) {
        setError(err.message || "Could not load health preferences.");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const handleChange = (e) => {
    setHealth({
      ...health,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/patient/${userId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthPreferences: {
            bloodGroup: health.bloodGroup,
            allergies: health.allergies,
            conditions: health.conditions,
            emergencyName: health.emergencyName,
            emergencyPhone: health.emergencyPhone,
            height: health.height,
            weight: health.weight,
            healthGoal: health.healthGoal,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save health preferences");
      localStorage.setItem("healthPreferences", JSON.stringify(health));
      alert("Health preferences saved successfully!");
    } catch (err) {
      setError(err.message || "Could not save health preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">

        <div className="settings-header">
          <button
            className="back-btn"
            onClick={() => navigate("/patient/settings")}
          >
            ← Back
          </button>

          <h1>🩺 Health Preferences</h1>
          <p>Manage your health information and preferences</p>
        </div>

        {error && <div className="error-message">❌ {error}</div>}
        {loading ? <p>Loading health preferences...</p> : (
          <form onSubmit={handleSave}>
            <div className="security-section">
              <h2>🩺 Basic Health Information</h2>

              <div className="security-form">
                <div className="input-group">
                  <label>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={health.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Height</label>
                  <input
                    type="text"
                    name="height"
                    placeholder="e.g. 165 cm"
                    value={health.height}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>Weight</label>
                  <input
                    type="text"
                    name="weight"
                    placeholder="e.g. 60 kg"
                    value={health.weight}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="security-section">
              <h2>💊 Medical Information</h2>

              <div className="input-group">
                <label>Allergies</label>
                <textarea
                  name="allergies"
                  placeholder="Enter any known allergies"
                  value={health.allergies}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="input-group" style={{ marginTop: "18px" }}>
                <label>Medical Conditions</label>
                <textarea
                  name="conditions"
                  placeholder="Enter existing medical conditions"
                  value={health.conditions}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
            </div>

            <div className="security-section">
              <h2>🚨 Emergency Contact</h2>

              <div className="security-form">
                <div className="input-group">
                  <label>Contact Name</label>
                  <input
                    type="text"
                    name="emergencyName"
                    placeholder="Enter contact name"
                    value={health.emergencyName}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    placeholder="Enter phone number"
                    value={health.emergencyPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="security-section">
              <h2>🎯 Health Goal</h2>
              <div className="input-group">
                <label>Select your health goal</label>
                <select
                  name="healthGoal"
                  value={health.healthGoal}
                  onChange={handleChange}
                >
                  <option value="General Fitness">General Fitness</option>
                  <option value="Weight Management">Weight Management</option>
                  <option value="Healthy Lifestyle">Healthy Lifestyle</option>
                  <option value="Heart Health">Heart Health</option>
                  <option value="Diabetes Management">Diabetes Management</option>
                </select>
              </div>
            </div>

            <button type="submit" className="save-details-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Health Preferences"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default HealthPreferencesPage;