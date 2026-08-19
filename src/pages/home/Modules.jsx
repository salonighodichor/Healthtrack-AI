const modules = [
  { icon: "💊", title: "Medication reminders", text: "Scheduled, personalized reminders with dose confirmation, so nothing gets missed silently." },
  { icon: "📅", title: "Appointment scheduling", text: "Follow-ups synced across patient, doctor, and caretaker calendars automatically." },
  { icon: "❤️", title: "Vitals & symptom logging", text: "Blood pressure, heart rate, temperature, and pain tracked with simple trend charts." },
  { icon: "🧠", title: "AI risk scoring", text: "Personalized recommendations and early warnings based on logged health data." },
  { icon: "💬", title: "Care team messaging", text: "Direct, secure messaging between patient, doctor, and caretaker — no phone tag." },
  { icon: "🔔", title: "Missed-dose & alert system", text: "Caretakers and doctors are notified automatically when something's off schedule." },
];

export default function Modules() {
  return (
    <section className="modules" id="features">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">What's inside</div>
          <h2>
            Every module maps to a real
            <br />
            post-discharge need
          </h2>
        </div>

        <div className="module-grid">
          {modules.map((m, i) => (
            <div className="module-card" key={i}>
              <div className="module-icon">{m.icon}</div>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}