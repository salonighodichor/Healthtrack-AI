const steps = [
  { num: "01", title: "Discharge", text: "Treatment instructions, prescriptions, and follow-up schedule are logged into the system." },
  { num: "02", title: "Home recovery", text: "Patient logs vitals and symptoms; reminders keep medication and appointments on schedule." },
  { num: "03", title: "Risk monitoring", text: "The AI module flags abnormal readings early, before they become a readmission." },
  { num: "04", title: "Follow-up", text: "Doctor reviews trends, adjusts care, and closes the loop with patient and caretaker." },
];

export default function Timeline() {
  return (
    <section className="wrap">
      <div className="timeline-section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">The care window we cover</div>
            <h2>From hospital exit to full recovery</h2>
            <p>The gap most systems ignore — HealTrack AI is built specifically for this window.</p>
          </div>

          <div className="steps">
            {steps.map((s, i) => (
              <div className="step" key={i}>
                <div className="step-num">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}