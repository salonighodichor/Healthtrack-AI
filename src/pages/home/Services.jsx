const services = [
  { icon: "📈", title: "Health Monitoring", text: "Track patient vitals and recovery progress in real time." },
  { icon: "💊", title: "Medication Reminders", text: "Smart reminders help patients take medicines on time." },
  { icon: "🩻", title: "AI Health Alerts", text: "AI detects unusual readings and sends alerts." },
  { icon: "👨‍⚕️", title: "Doctor Connectivity", text: "Doctors can monitor patient recovery remotely." },
  { icon: "🤝", title: "Caretaker Support", text: "Caretakers receive updates and notifications." },
  { icon: "🚨", title: "Emergency Assistance", text: "Quick emergency alerts for immediate response." },
];

export default function Services() {
  return (
    <section className="services" id="services">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">What we offer</div>
          <h2>Our Services</h2>
        </div>

        <div className="service-list">
          {services.map((s, i) => (
            <div className="service-row" key={i}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-text">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}