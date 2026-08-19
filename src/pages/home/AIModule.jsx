const features = [
  "AI Health Risk Detection",
  "Smart Medication Assistant",
  "Recovery Progress Prediction",
  "Emergency Alert Monitoring",
  "Personalized Health Recommendations",
  "Doctor & Caretaker Notifications",
];

const patients = [
  { name: "Meera K.", meta: "Day 4 post-op", risk: "high", label: "High" },
  { name: "Arjun S.", meta: "Day 9, cardiac", risk: "medium", label: "Medium" },
  { name: "Fatima N.", meta: "Day 16, ortho", risk: "low", label: "Low" },
  { name: "Rohan P.", meta: "Day 2 post-op", risk: "medium", label: "Medium" },
];

export default function AIModule() {
  return (
    <section className="ai-module" id="ai-module">
      <div className="wrap ai-grid">
        <div className="ai-copy">
          <div className="eyebrow">The AI module</div>
          <h2>Smart healthcare powered by artificial intelligence</h2>
          <p>
            HealTrack AI uses advanced AI models to monitor patient recovery, analyze health data,
            and provide real-time recommendations for better post-discharge care.
          </p>
          <ul className="feature-list">
            {features.map((f, i) => (
              <li key={i}>
                <span className="dot">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="queue-card">
          <div className="queue-head">
            <span>Today's patient risk queue</span>
          </div>
          {patients.map((p, i) => (
            <div className="queue-row" key={i}>
              <div>
                <div className="patient-name">{p.name}</div>
                <div className="patient-meta">{p.meta}</div>
              </div>
              <span className={`risk-badge risk-${p.risk}`}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}