import { Link } from "react-router-dom";

const chartBars = [40, 60, 45, 80, 65, 90, 70, 95];

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">

        {/* LEFT SIDE */}
        <div className="hero-content">
          <div className="eyebrow">AI-Powered Care Platform</div>

          <h1>
            Smart AI Powered{" "}
            <span className="accent">Personalized</span>
            <br />
            Healthcare Management System
          </h1>

          <p className="lead">
            AI-driven platform to manage health, appointments, medications
            and recovery with personalized care.
          </p>

          <div className="hero-ctas">
            <Link
              to="/create-account"
              className="btn btn-primary hero-btn"
            >
              Create your account →
            </Link>

            <a
              href="#services"
              className="btn btn-outline hero-btn"
            >
              See how it works
            </a>
          </div>

          <div className="pill-row">
            <span className="pill">🧑 For Patients</span>
            <span className="pill">🩺 For Doctors</span>
            <span className="pill">🤝 For Caretakers</span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="hero-visual">

          <div className="hv-badge">
            💚 Healthcare
          </div>

          {/* HEALTH OVERVIEW */}
          <div className="hv-stat health-overview">
            <div className="hv-row">
              <div>
                <div className="label">Patient Health Overview</div>
                <div className="value">92%</div>
              </div>

              <span className="risk-badge risk-low">
                On track
              </span>
            </div>

            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: "92%" }}
              ></div>
            </div>

            <div className="progress-text">
              <span>Recovery progress</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* HEALTH CHART */}
          <div className="hv-stat">
            <div className="hv-row">
              <div>
                <div className="label">Recovery Activity</div>
                <div className="chart-subtitle">
                  Weekly health progress
                </div>
              </div>

              <span className="chart-status">+18%</span>
            </div>

            <div className="hv-mini-chart">
              {chartBars.map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                ></span>
              ))}
            </div>
          </div>

          {/* AI INSIGHT */}
          <div className="hv-stat ai-insight">
            <div className="ai-icon">✨</div>

            <div>
              <div className="label">AI Insight</div>
              <p>
                Your recovery trend is improving. Keep following
                your medication schedule.
              </p>
            </div>
          </div>

          {/* MEDICATION */}
          <div className="hv-stat medication-card">
            <div>
              <div className="label">Next reminder</div>

              <div className="medication-name">
                💊 Evening medication
              </div>
            </div>

            <span className="medication-time">
              8:00 PM
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}