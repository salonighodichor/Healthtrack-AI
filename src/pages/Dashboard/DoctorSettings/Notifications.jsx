
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";

function Notifications() {
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    patientUpdates: true,
    systemNotifications: true,
    emailNotifications: false,
  });

  const handleToggle = (name) => {
    setNotifications({
      ...notifications,
      [name]: !notifications[name],
    });
  };

  const handleSave = () => {
    alert("Notification settings saved successfully!");
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">

        <button
  className="back-settings-btn"
  onClick={() => navigate("/doctor/settings")}
>
  ← Back
</button>
        <h1>Notifications</h1>
        <p>Manage your notification preferences</p>
      </div>

      <div className="notifications-card">

        <div className="notification-item">
          <div>
            <h3>Appointment Reminders</h3>
            <p>Receive reminders about upcoming appointments.</p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={notifications.appointmentReminders}
              onChange={() => handleToggle("appointmentReminders")}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div>
            <h3>Patient Updates</h3>
            <p>Get notifications when there are updates from patients.</p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={notifications.patientUpdates}
              onChange={() => handleToggle("patientUpdates")}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div>
            <h3>System Notifications</h3>
            <p>Receive important updates and system alerts.</p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={notifications.systemNotifications}
              onChange={() => handleToggle("systemNotifications")}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div>
            <h3>Email Notifications</h3>
            <p>Receive notification updates through email.</p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={() => handleToggle("emailNotifications")}
            />
            <span className="slider"></span>
          </label>
        </div>

        <button
          className="save-notifications-btn"
          onClick={handleSave}
        >
          Save Changes
        </button>

      </div>
    </div>
  );
}

export default Notifications;