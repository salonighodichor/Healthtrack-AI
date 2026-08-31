import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./SettingsPage.css";

function NotificationsPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [medicine, setMedicine] = useState(true);
  const [appointment, setAppointment] = useState(true);
  const [email, setEmail] = useState(true);
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

        if (!response.ok) {
          throw new Error(data.message || "Unable to load notification preferences");
        }

        const notifications = data.notifications || {};
        setNotificationsEnabled(Boolean(notifications.enabled ?? true));
        setAppNotifications(Boolean(notifications.appNotifications ?? notifications.enabled ?? true));
        setSmsNotifications(Boolean(notifications.smsNotifications ?? true));
        setMedicine(Boolean(notifications.medicineReminder ?? true));
        setAppointment(Boolean(notifications.appointmentReminder ?? true));
        setEmail(Boolean(notifications.emailNotifications ?? true));
      } catch (err) {
        setError(err.message || "Could not load notification preferences.");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/patient/${userId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications: {
            enabled: notificationsEnabled,
            appNotifications: appNotifications,
            smsNotifications: smsNotifications,
            medicineReminder: medicine,
            appointmentReminder: appointment,
            emailNotifications: email,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to save notifications");
      }

      alert("Notification preferences saved!");
    } catch (err) {
      setError(err.message || "Could not save notifications.");
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

          <h1>🔔 Notifications</h1>
          <p>Manage your notification preferences</p>
        </div>

        {error && <div className="error-message">❌ {error}</div>}
        {loading ? <p>Loading preferences...</p> : (
          <>
            <div className="setting-card single-card">
              <div>
                <h2>🔔 Enable Notifications</h2>
                <p>Turn all in-app and SMS notifications on or off</p>
              </div>

              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
            </div>

            <div className="setting-card single-card">
              <div>
                <h2>📱 App Notifications</h2>
                <p>Show in-app toast and alert banners on the dashboard</p>
              </div>

              <input
                type="checkbox"
                checked={appNotifications && notificationsEnabled}
                disabled={!notificationsEnabled}
                onChange={(e) => setAppNotifications(e.target.checked)}
              />
            </div>

            <div className="setting-card single-card">
              <div>
                <h2>📲 SMS Notifications</h2>
                <p>Send critical health alerts to your mobile phone</p>
              </div>

              <input
                type="checkbox"
                checked={smsNotifications && notificationsEnabled}
                disabled={!notificationsEnabled}
                onChange={(e) => setSmsNotifications(e.target.checked)}
              />
            </div>

            <div className="setting-card">
              <div>
                <h2>💊 Medicine Reminders</h2>
                <p>Receive reminders for your medicines</p>
              </div>
 
              <input
                type="checkbox"
                checked={medicine && notificationsEnabled}
                disabled={!notificationsEnabled}
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
                checked={appointment && notificationsEnabled}
                disabled={!notificationsEnabled}
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
                checked={email && notificationsEnabled}
                disabled={!notificationsEnabled}
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
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default NotificationsPage;