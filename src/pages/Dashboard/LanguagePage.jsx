import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./SettingsPage.css";

function LanguagePage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLanguage = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/patient/${userId}/settings`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load language");
        setLanguage(data.language || "English");
        localStorage.setItem("language", data.language || "English");
      } catch (err) {
        setError(err.message || "Could not fetch language settings.");
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/patient/${userId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save language");
      localStorage.setItem("language", language);
      alert(`Language changed to ${language}`);
    } catch (err) {
      setError(err.message || "Could not save language.");
    } finally {
      setSaving(false);
    }
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

        {error && <div className="error-message">❌ {error}</div>}
        {loading ? <p>Loading language settings...</p> : (
          <>
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
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Language"}
              </button>
            </div>

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
          </>
        )}

      </div>
    </div>
  );
}

export default LanguagePage;