import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./SettingsPage.css";

function AIPreferencesPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [preferences, setPreferences] = useState({
    aiAssistant: true,
    healthSuggestions: true,
    medicationSuggestions: true,
    language: "English",
    responseStyle: "Simple",
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
        if (!response.ok) throw new Error(data.message || "Unable to load AI preferences");

        const apiPreferences = data.aiPreferences || {};
        setPreferences({
          aiAssistant: Boolean(apiPreferences.aiAssistant ?? true),
          healthSuggestions: Boolean(apiPreferences.healthSuggestions ?? true),
          medicationSuggestions: Boolean(apiPreferences.medicationSuggestions ?? true),
          language: apiPreferences.language || "English",
          responseStyle: apiPreferences.responseStyle || "Simple",
        });
      } catch (err) {
        setError(err.message || "Could not load AI preferences.");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPreferences({
      ...preferences,
      [name]: type === "checkbox" ? checked : value,
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
          aiPreferences: {
            aiAssistant: preferences.aiAssistant,
            healthSuggestions: preferences.healthSuggestions,
            medicationSuggestions: preferences.medicationSuggestions,
            language: preferences.language,
            responseStyle: preferences.responseStyle,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save preferences");
      localStorage.setItem("aiPreferences", JSON.stringify(preferences));
      alert("AI preferences saved successfully!");
    } catch (err) {
      setError(err.message || "Could not save AI preferences.");
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

          <h1>🤖 AI Preferences</h1>
          <p>Customize your AI Health Assistant experience</p>
        </div>

        {error && <div className="error-message">❌ {error}</div>}
        {loading ? <p>Loading AI preferences...</p> : (
          <>
            <div className="security-section">
              <h2>🤖 AI Health Assistant</h2>

              <div className="preference-row">
                <div>
                  <h3>Enable AI Assistant</h3>
                  <p>
                    Allow the AI assistant to provide general health
                    information and guidance.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="aiAssistant"
                  checked={preferences.aiAssistant}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="security-section">
              <h2>💡 AI Suggestions</h2>

              <div className="preference-row">
                <div>
                  <h3>Health Suggestions</h3>
                  <p>
                    Receive general wellness suggestions.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="healthSuggestions"
                  checked={preferences.healthSuggestions}
                  onChange={handleChange}
                />
              </div>

              <div className="preference-row">
                <div>
                  <h3>Medication Information</h3>
                  <p>
                    Receive general information about medicines
                    and reminders.
                  </p>
                </div>

                <input
                  type="checkbox"
                  name="medicationSuggestions"
                  checked={preferences.medicationSuggestions}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="security-section">
              <h2>🌐 AI Language</h2>

              <div className="input-group">
                <label>Preferred Language</label>

                <select
                  name="language"
                  value={preferences.language}
                  onChange={handleChange}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Marathi">Marathi</option>
                </select>
              </div>
            </div>

            <div className="security-section">
              <h2>💬 Response Style</h2>

              <div className="input-group">
                <label>Choose how AI should respond</label>

                <select
                  name="responseStyle"
                  value={preferences.responseStyle}
                  onChange={handleChange}
                >
                  <option value="Simple">Simple & Easy</option>
                  <option value="Detailed">Detailed</option>
                  <option value="Short">Short & Quick</option>
                </select>
              </div>
            </div>

            <button
              className="save-details-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save AI Preferences"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default AIPreferencesPage;