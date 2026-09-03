import { Link } from "react-router-dom";
import "./Emergency.css";

export default function Emergency() {
  return (
    <div className="emergency-page">
      <div className="emergency-card">

        {/* Emergency Icon */}
        <div className="emergency-icon">🚨</div>

        {/* Heading */}
        <h1>Emergency Assistance</h1>

        <p className="emergency-text">
          For immediate medical or emergency assistance,
          choose a service below.
        </p>

        {/* Ambulance */}
        <a href="tel:108" className="emergency-btn ambulance">
          <span>🚑 Ambulance</span>
          <strong>108</strong>
        </a>

        {/* Emergency Helpline */}
        <a href="tel:112" className="emergency-btn helpline">
          <span>🆘 Emergency Helpline</span>
          <strong>112</strong>
        </a>

        {/* Back to Home */}
        <Link to="/" className="back-home">
          ← Back to Home
        </Link>

        {/* Note */}
        <small className="emergency-note">
          Please use these numbers only for emergencies.
        </small>

      </div>
    </div>
  );
}