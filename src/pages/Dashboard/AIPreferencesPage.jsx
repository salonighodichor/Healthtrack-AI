import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

function AIPreferencesPage() {
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState({
    aiAssistant: true,
    healthSuggestions: true,
    medicationSuggestions: true,
    language: "English",
    responseStyle: "Simple",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPreferences({
      ...preferences,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "aiPreferences",
      JSON.stringify(preferences)
    );

    alert("AI preferences saved successfully!");
  };

  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* Header */}
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

        {/* AI Assistant */}
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

        {/* AI Suggestions */}
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

        {/* AI Language */}
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

        {/* Response Style */}
        <div className="security-section">
          <h2>💬 Response Style</h2>

          <div className="input-group">
            <label>Choose how AI should respond</label>

            <select
              name="responseStyle"
              value={preferences.responseStyle}
              onChange={handleChange}
            >
              <option value="Simple">
                Simple & Easy
              </option>

              <option value="Detailed">
                Detailed
              </option>

              <option value="Short">
                Short & Quick
              </option>
            </select>
          </div>
        </div>

        {/* Save */}
        <button
          className="save-details-btn"
          onClick={handleSave}
        >
          Save AI Preferences
        </button>

      </div>
    </div>
  );
}

export default AIPreferencesPage;