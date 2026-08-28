import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Availability.css";

function Availability() {
  const navigate = useNavigate();

  const [days, setDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const handleDayChange = (day) => {
    setDays({
      ...days,
      [day]: !days[day],
    });
  };

  const handleSave = () => {
    alert("Availability and working hours saved successfully!");
  };

  return (
    <div className="availability-container">

      <div className="availability-header">

        <button
          className="back-settings-btn"
          onClick={() => navigate("/doctor/settings")}
        >
          ← Back
        </button>

        <h1>Availability & Working Hours</h1>
        <p>Set your available days and working hours.</p>

      </div>

      <div className="availability-card">

        <h2>Available Days</h2>

        <div className="days-list">
          {Object.keys(days).map((day) => (
            <label key={day} className="day-item">
              <input
                type="checkbox"
                checked={days[day]}
                onChange={() => handleDayChange(day)}
              />
              <span>{day}</span>
            </label>
          ))}
        </div>

        <div className="working-hours-section">

          <h2>Working Hours</h2>

          <div className="time-inputs">

            <div className="time-group">
              <label>Start Time</label>

              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="time-group">
              <label>End Time</label>

              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

          </div>

        </div>

        <button
          className="save-availability-btn"
          onClick={handleSave}
        >
          Save Changes
        </button>

      </div>
    </div>
  );
}

export default Availability;