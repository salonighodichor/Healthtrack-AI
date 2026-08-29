import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

function ConnectedDevicesPage() {
  const navigate = useNavigate();

  const [devices, setDevices] = useState([
    {
      id: 1,
      name: "Smart Watch",
      type: "Fitness & Health",
      connected: true,
    },
    {
      id: 2,
      name: "Blood Pressure Monitor",
      type: "Blood Pressure",
      connected: false,
    },
    {
      id: 3,
      name: "Glucose Monitor",
      type: "Blood Glucose",
      connected: false,
    },
  ]);

  const toggleDevice = (id) => {
    setDevices(
      devices.map((device) =>
        device.id === id
          ? { ...device, connected: !device.connected }
          : device
      )
    );
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

          <h1>📱 Connected Devices</h1>
          <p>Manage your connected health devices</p>
        </div>

        {/* Devices */}
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

        {/* Information */}
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

      </div>
    </div>
  );
}

export default ConnectedDevicesPage;