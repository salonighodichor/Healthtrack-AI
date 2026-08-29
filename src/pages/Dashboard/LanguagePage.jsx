import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

function LanguagePage() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const handleSave = () => {
    localStorage.setItem("language", language);
    alert(`Language changed to ${language}`);
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

          <h1>🌐 Language</h1>
          <p>Select your preferred language</p>
        </div>

        {/* Language Selection */}
        <div className="security-section">
          <h2>🌐 Preferred Language</h2>

          <div className="input-group">
            <label>Select Language</label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>

          <button
            className="save-details-btn"
            onClick={handleSave}
          >
            Save Language
          </button>
        </div>

        {/* Available Languages */}
        <div className="security-section">
          <h2>🗣️ Available Languages</h2>

          <div className="language-list">
            <div className="language-item">
              <span>🇬🇧 English</span>
              {language === "English" && <span>✓</span>}
            </div>

            <div className="language-item">
              <span>🇮🇳 Hindi</span>
              {language === "Hindi" && <span>✓</span>}
            </div>

            <div className="language-item">
              <span>🇮🇳 Marathi</span>
              {language === "Marathi" && <span>✓</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LanguagePage;