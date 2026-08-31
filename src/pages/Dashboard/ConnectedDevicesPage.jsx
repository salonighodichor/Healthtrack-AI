import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./SettingsPage.css";

function ConnectedDevicesPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDevices = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/patient/${userId}/settings`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load devices");
        setDevices(Array.isArray(data.devices) ? data.devices : []);
      } catch (err) {
        setError(err.message || "Unable to load connected devices.");
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, [userId]);

  const persistDevices = async (updatedDevices) => {
    if (!userId) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/patient/${userId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devices: updatedDevices }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update devices");
    } catch (err) {
      setError(err.message || "Unable to save device status.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDevice = async (id) => {
    const updatedDevices = devices.map((device) =>
      device.id === id ? { ...device, connected: !device.connected } : device
    );
    setDevices(updatedDevices);
    await persistDevices(updatedDevices);
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

          <h1>📱 Connected Devices</h1>
          <p>Manage your connected health devices</p>
        </div>

        {error && <div className="error-message">❌ {error}</div>}
        {saving && <p>Saving device status...</p>}
        {loading ? <p>Loading devices...</p> : (
          <>
            {devices.map((device) => (
              <div className="device-card" key={device.id}>

                <div className="device-icon">
                  📱
                </div>

                <div className="device-info">
                  <h2>{device.name}</h2>
                  <p>{device.type}</p>

                  <span
                    className={
                      device.connected
                        ? "device-status connected"
                        : "device-status"
                    }
                  >
                    {device.connected ? "● Connected" : "○ Not Connected"}
                  </span>
                </div>

                <button
                  className={
                    device.connected
                      ? "device-btn disconnect"
                      : "device-btn"
                  }
                  onClick={() => toggleDevice(device.id)}
                >
                  {device.connected ? "Disconnect" : "Connect"}
                </button>

              </div>
            ))}

            <div className="security-section device-info-box">
              <h2>ℹ️ About Connected Devices</h2>

              <p>
                Connected health devices can help you track health
                information such as activity, blood pressure and
                other measurements.
              </p>

              <p>
                Make sure you only connect devices that belong to you
                or that you trust.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default ConnectedDevicesPage;