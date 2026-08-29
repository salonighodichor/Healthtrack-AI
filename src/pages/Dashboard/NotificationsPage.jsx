import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";


function NotificationsPage() {
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(true);
  const [appointment, setAppointment] = useState(true);
  const [email, setEmail] = useState(true);

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

          <h1>🔔 Notifications</h1>
          <p>Manage your notification preferences</p>
        </div>

        <div className="setting-card">
          <div>
            <h2>💊 Medicine Reminders</h2>
            <p>Receive reminders for your medicines</p>
          </div>

          <input
            type="checkbox"
            checked={medicine}
            onChange={(e) => setMedicine(e.target.checked)}
          />
        </div>

        <div className="setting-card single-card">
          <div>
            <h2>📅 Appointment Reminders</h2>
            <p>Receive reminders about upcoming appointments</p>
          </div>

          <input
            type="checkbox"
            checked={appointment}
            onChange={(e) => setAppointment(e.target.checked)}
          />
        </div>

        <div className="setting-card single-card">
          <div>
            <h2>📧 Email Notifications</h2>
            <p>Receive important health updates through email</p>
          </div>

          <input
            type="checkbox"
            checked={email}
            onChange={(e) => setEmail(e.target.checked)}
          />
        </div>

        <button
          className="logout-btn"
          style={{
            background: "#2563eb",
            color: "white",
            marginTop: "25px",
          }}
          onClick={() => alert("Notification preferences saved!")}
        >
          Save Preferences
        </button>

      </div>
    </div>
  );
}

export default NotificationsPage;