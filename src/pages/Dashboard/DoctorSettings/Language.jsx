import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Language.css";

function Language() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("English");

  const handleSave = () => {
    alert(`Language changed to ${language}`);
  };

  return (
    <div className="language-container">

      <div className="language-header">

        <button
          className="back-settings-btn"
          onClick={() => navigate("/doctor/settings")}
        >
          ← Back
        </button>

        <h1>Language</h1>
        <p>Select your preferred language.</p>

      </div>

      <div className="language-card">

        <label htmlFor="language">
          Preferred Language
        </label>

        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Marathi">Marathi</option>
        </select>

        <button
          className="save-language-btn"
          onClick={handleSave}
        >
          Save Language
        </button>

      </div>

    </div>
  );
}

export default Language;