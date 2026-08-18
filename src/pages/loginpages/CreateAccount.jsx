import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateAccount.css";

function CreateAccount() {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={`create-account-page ${darkMode ? "dark-mode" : ""}`}>

      {/* Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={() => setDarkMode(!darkMode)}
        aria-label="Toggle theme"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div className="account-card">

        <h1>HealTrack AI</h1>

        <p className="tagline">
          Your recovery, our support
        </p>

        <h2>Create Account</h2>

        <p className="register-text">
          I am registering as
        </p>

        <div className="role-buttons">

          {/* Patient */}
          <button
            className="role-btn"
            onClick={() => navigate("/patient-register")}
          >
            Patient
          </button>

          {/* Doctor */}
          <button
            className="role-btn"
            onClick={() => navigate("/doctor-register")}
          >
            Doctor
          </button>

          {/* Caretaker */}
          <button
            className="role-btn"
            onClick={() => navigate("/caretaker-register")}
          >
            Caretaker
          </button>

        </div>

        <p className="login-text">
          Already have an account?
        </p>

        <button
          className="login-btn"
          onClick={() => navigate("/login")}
        >
          Login
        </button>

      </div>
    </div>
  );
}

export default CreateAccount;