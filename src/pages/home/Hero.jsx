import { Link } from "react-router-dom";

const chartBars = [40, 60, 45, 80, 65, 90, 70, 95];

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <div className="eyebrow">AI-Powered Care Platform</div>
          <h1>
            Smart AI Powered <span className="accent">Personalized</span>
            <br />
            Healthcare Management System
          </h1>
          <p className="lead">
            AI-driven platform to manage health, appointments, medications and recovery with personalized care.
          </p>

          <div className="hero-ctas">
            <Link to="/create-account" className="btn btn-primary">Create your account →</Link>
            <a href="#services" className="btn btn-outline">See how it works</a>
          </div>

          <div className="pill-row">
            <span className="pill">🧑 For Patients</span>
            <span className="pill">🩺 For Doctors</span>
            <span className="pill">🤝 For Caretakers</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hv-badge">💚 Healthcare</div>

          <div className="hv-stat">
            <div className="hv-row">
              <div>
                <div className="label">Recovery score</div>
                <div className="value">92%</div>
              </div>
              <span className="risk-badge risk-low">On track</span>
            </div>
            <div className="hv-mini-chart">
              {chartBars.map((h, i) => (
                <span key={i} style={{ height: `${h}%` }}></span>
              ))}
            </div>
          </div>

          <div className="hv-stat">
            <div className="label">Next reminder</div>
            <div className="hv-row" style={{ marginTop: 4 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                Evening medication — 8:00 PM
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}