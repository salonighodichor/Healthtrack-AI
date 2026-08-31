import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

function SettingsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* Header */}
        <div className="settings-header">
          <button
            className="back-btn"
            onClick={() => navigate("/patient")}
          >
            ← Back
          </button>

          <h1>⚙️ Settings</h1>
          <p>Manage your preferences and account settings</p>
        </div>

        {/* Settings Cards */}
        <div className="settings-grid">

          {/* Notifications */}
          <div
            className="setting-card"
            onClick={() => navigate("/patient/notifications")}
          >
            <div className="setting-icon">🔔</div>
            <div>
              <h2>Notifications</h2>
              <p>Manage your reminders and notifications</p>
            </div>
            <span className="arrow">›</span>
          </div>

          {/* Security */}
          <div
            className="setting-card"
            onClick={() => navigate("/patient/security")}
          >
            <div className="setting-icon">🔐</div>
            <div>
              <h2>Security & Privacy</h2>
              <p>Manage password and account security</p>
            </div>
            <span className="arrow">›</span>
          </div>

          {/* Health Preferences */}
          <div
            className="setting-card"
            onClick={() => navigate("/patient/health-preferences")}
          >
            <div className="setting-icon">🩺</div>
            <div>
              <h2>Health Preferences</h2>
              <p>Manage your health-related preferences</p>
            </div>
            <span className="arrow">›</span>
          </div>

          {/* AI Preferences */}
          <div
            className="setting-card"
            onClick={() => navigate("/patient/ai-preferences")}
          >
            <div className="setting-icon">🤖</div>
            <div>
              <h2>AI Preferences</h2>
              <p>Customize your AI health assistant</p>
            </div>
            <span className="arrow">›</span>
          </div>

          {/* Connected Devices */}
          <div
            className="setting-card"
            onClick={() => navigate("/patient/devices")}
          >
            <div className="setting-icon">📱</div>
            <div>
              <h2>Connected Devices</h2>
              <p>Manage your connected health devices</p>
            </div>
            <span className="arrow">›</span>
          </div>

          {/* Language */}
          <div
            className="setting-card"
            onClick={() => navigate("/patient/language")}
          >
            <div className="setting-icon">🌐</div>
            <div>
              <h2>Language</h2>
              <p>Choose your preferred language</p>
            </div>
            <span className="arrow">›</span>
          </div>

        </div>

        {/* Help & Support */}
        <div
          className="setting-card single-card"
          onClick={() => navigate("/patient/help")}
        >
          <div className="setting-icon">❓</div>
          <div>
            <h2>Help & Support</h2>
            <p>Get help and contact support</p>
          </div>
          <span className="arrow">›</span>
        </div>

        {/* Logout */}
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>

      </div>
    </div>
  );
}

export default SettingsPage;