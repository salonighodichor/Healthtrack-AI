import React from "react";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  return (
    <div className="page-stack">

      <div className="settings-header">

        <button
          className="back-settings-btn"
          onClick={() => navigate("/doctor")}
        >
          ← Back
        </button>

        <h1>⚙️ Settings</h1>

        <p>
          Manage your account and dashboard preferences
        </p>

      </div>

      <div className="settings-grid">

        {/* Notifications */}
        <div
          className="settings-option"
          onClick={() => navigate("/doctor/settings/notifications")}
        >
          <div className="settings-option-icon">
            🔔
          </div>

          <div className="settings-option-content">
            <h3>Notifications</h3>

            <p>
              Manage appointment, patient, recovery and emergency alerts.
            </p>
          </div>

          <span className="settings-arrow">
            →
          </span>
        </div>


        {/* Change Password */}
        <div
          className="settings-option"
          onClick={() => navigate("/doctor/settings/change-password")}
        >
          <div className="settings-option-icon">
            🔒
          </div>

          <div className="settings-option-content">
            <h3>Change Password</h3>

            <p>
              Update your account password securely.
            </p>
          </div>

          <span className="settings-arrow">
            →
          </span>
        </div>


        {/* Language */}
        <div
          className="settings-option"
          onClick={() => navigate("/doctor/settings/language")}
        >
          <div className="settings-option-icon">
            🌐
          </div>

          <div className="settings-option-content">
            <h3>Language</h3>

            <p>
              Choose your preferred application language.
            </p>
          </div>

          <span className="settings-arrow">
            →
          </span>
        </div>


        {/* Availability */}
        <div
          className="settings-option"
          onClick={() => navigate("/doctor/settings/availability")}
        >
          <div className="settings-option-icon">
            📅
          </div>

          <div className="settings-option-content">
            <h3>Availability & Working Hours</h3>

            <p>
              Manage your working days and available hours.
            </p>
          </div>

          <span className="settings-arrow">
            →
          </span>
        </div>


        {/* Help & Support */}
        <div
          className="settings-option"
          onClick={() => navigate("/doctor/settings/help")}
        >
          <div className="settings-option-icon">
            ❓
          </div>

          <div className="settings-option-content">
            <h3>Help & Support</h3>

            <p>
              Get help, view FAQs or report an issue.
            </p>
          </div>

          <span className="settings-arrow">
            →
          </span>
        </div>

      </div>

    </div>
  );
}

export default Settings;