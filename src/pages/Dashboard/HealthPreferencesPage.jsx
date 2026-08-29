import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

function HealthPreferencesPage() {
  const navigate = useNavigate();

  const [health, setHealth] = useState({
    bloodGroup: "",
    allergies: "",
    conditions: "",
    emergencyName: "",
    emergencyPhone: "",
    height: "",
    weight: "",
    healthGoal: "General Fitness",
  });

  const handleChange = (e) => {
    setHealth({
      ...health,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Backend connection will be added later
    localStorage.setItem("healthPreferences", JSON.stringify(health));

    alert("Health preferences saved successfully!");
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

          <h1>🩺 Health Preferences</h1>
          <p>Manage your health information and preferences</p>
        </div>

        <form onSubmit={handleSave}>

          {/* Basic Health Information */}
          <div className="security-section">
            <h2>🩺 Basic Health Information</h2>

            <div className="security-form">

              <div className="input-group">
                <label>Blood Group</label>

                <select
                  name="bloodGroup"
                  value={health.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="input-group">
                <label>Height</label>

                <input
                  type="text"
                  name="height"
                  placeholder="e.g. 165 cm"
                  value={health.height}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Weight</label>

                <input
                  type="text"
                  name="weight"
                  placeholder="e.g. 60 kg"
                  value={health.weight}
                  onChange={handleChange}
                />
              </div>

            </div>
          </div>

          {/* Medical Information */}
          <div className="security-section">
            <h2>💊 Medical Information</h2>

            <div className="input-group">
              <label>Allergies</label>

              <textarea
                name="allergies"
                placeholder="Enter any known allergies"
                value={health.allergies}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="input-group" style={{ marginTop: "18px" }}>
              <label>Medical Conditions</label>

              <textarea
                name="conditions"
                placeholder="Enter existing medical conditions"
                value={health.conditions}
                onChange={handleChange}
                rows="3"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="security-section">
            <h2>🚨 Emergency Contact</h2>

            <div className="security-form">

              <div className="input-group">
                <label>Contact Name</label>

                <input
                  type="text"
                  name="emergencyName"
                  placeholder="Enter contact name"
                  value={health.emergencyName}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Contact Phone</label>

                <input
                  type="tel"
                  name="emergencyPhone"
                  placeholder="Enter phone number"
                  value={health.emergencyPhone}
                  onChange={handleChange}
                />
              </div>

            </div>
          </div>

          {/* Health Goal */}
          <div className="security-section">
            <h2>🎯 Health Goal</h2>

            <div className="input-group">

              <label>Select your health goal</label>

              <select
                name="healthGoal"
                value={health.healthGoal}
                onChange={handleChange}
              >
                <option value="General Fitness">
                  General Fitness
                </option>

                <option value="Weight Management">
                  Weight Management
                </option>

                <option value="Healthy Lifestyle">
                  Healthy Lifestyle
                </option>

                <option value="Heart Health">
                  Heart Health
                </option>

                <option value="Diabetes Management">
                  Diabetes Management
                </option>
              </select>

            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            className="save-details-btn"
          >
            Save Health Preferences
          </button>

        </form>

      </div>
    </div>
  );
}

export default HealthPreferencesPage;