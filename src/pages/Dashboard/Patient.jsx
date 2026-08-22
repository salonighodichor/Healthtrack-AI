import { useState } from "react";
import { Link } from "react-router-dom";
import "./Patient.css";


const menuItems = [
  { name: "Dashboard", icon: "🏠" },
  { name: "Health Overview", icon: "❤️" },
  { name: "Recovery Progress", icon: "📈" },
  { name: "Health Records", icon: "📄" },
  { name: "AI Analysis", icon: "🤖" },
  { name: "Medicines", icon: "💊" },
  { name: "Appointments", icon: "📅" },
  { name: "Alerts", icon: "🔔" },
  { name: "Recovery Plan", icon: "📝" },
];

const PageHeader = ({ icon, title, subtitle }) => (
  <div className="page-heading">
    <div>
      <h1>{icon} {title}</h1>
      <p>{subtitle}</p>
    </div>
  </div>
);

const HealthOverview = () => (
  <div className="page-stack">
    <PageHeader icon="❤️" title="Health Overview" subtitle="Today's health measurements and wellness status" />

    <div className="health-cards">
      <div className="health-card sugar">
        <div className="health-icon">🩸</div>
        <span>Blood Sugar</span>
        <h3>80 <small>mg/dL</small></h3>
        <label>✓ Normal</label>
      </div>
      <div className="health-card heart">
        <div className="health-icon">❤️</div>
        <span>Heart Rate</span>
        <h3>98 <small>BPM</small></h3>
        <label>✓ Normal</label>
      </div>
      <div className="health-card pressure">
        <div className="health-icon">💓</div>
        <span>Blood Pressure</span>
        <h3>90 <small>/ 72 mmHg</small></h3>
        <label>✓ Normal</label>
      </div>
      <div className="health-card hemoglobin">
        <div className="health-icon">🩸</div>
        <span>Hemoglobin</span>
        <h3>14 <small>g/dL</small></h3>
        <label>✓ Normal</label>
      </div>
    </div>

    <div className="content-grid two-col">
      <div className="dashboard-card">
        <div className="card-title">
          <div><h2>📊 Health Summary</h2><p>Quick view of your current health</p></div>
        </div>
        <div className="summary-list">
          <div><span>Overall Health</span><strong className="status-good">Good</strong></div>
          <div><span>Heart Status</span><strong>Stable</strong></div>
          <div><span>Recovery Status</span><strong>78%</strong></div>
          <div><span>Last Checkup</span><strong>Recent</strong></div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-title">
          <div><h2>💡 Health Tips</h2><p>Simple daily reminders</p></div>
        </div>
        <div className="tip-list">
          <div>🚶 Stay active with light daily movement.</div>
          <div>💧 Keep yourself hydrated.</div>
          <div>🥗 Follow your recommended meal plan.</div>
          <div>😴 Maintain a regular sleep schedule.</div>
        </div>
      </div>
    </div>
  </div>
);

const RecoveryProgress = () => (
  <div className="page-stack">
    <PageHeader icon="📈" title="Recovery Progress" subtitle="Track your recovery journey in one place" />

    <div className="dashboard-card recovery-main-card">
      <div className="recovery-main">
        <div className="progress-circle large">
          <div><strong>78%</strong><small>Recovered</small></div>
        </div>
        <div className="recovery-details">
          <h2>💚 Overall Recovery</h2>
          <p>Your recovery is progressing steadily.</p>
          {[
            ["Physical Recovery", "82%"],
            ["Medication", "90%"],
            ["Daily Activity", "65%"],
          ].map(([label, value]) => (
            <div className="progress-item" key={label}>
              <div className="progress-row"><span>{label}</span><strong>{value}</strong></div>
              <div className="progress-bar"><div style={{ width: value }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="content-grid three-col">
      <div className="mini-stat"><span>💪</span><strong>82%</strong><small>Physical Recovery</small></div>
      <div className="mini-stat"><span>💊</span><strong>90%</strong><small>Medication Adherence</small></div>
      <div className="mini-stat"><span>🚶</span><strong>65%</strong><small>Daily Activity</small></div>
    </div>
  </div>
);

const HealthRecords = ({ openModal }) => {
  const records = [
    ["🏥", "Medical Check Up Report", "Today • 2 MB"],
    ["🩸", "Blood Count Report", "Yesterday • 5 MB"],
    ["❤️", "Heart ECG Report", "05 Mar 2024 • 10 MB"],
    ["🧠", "MRI Brain Report", "03 Mar 2024 • 25.8 MB"],
  ];

  return (
    <div className="page-stack">
      <PageHeader icon="📄" title="Health Records" subtitle="Your recent medical documents and reports" />
      <div className="dashboard-card">
        <div className="record-list large-list">
          {records.map(([icon, title, meta]) => (
            <button className="record-item" key={title} onClick={() => openModal(`📄 ${title}`, `Report details for ${title}`)}>
              <div className="record-icon">{icon}</div>
              <div><strong>{title}</strong><p>{meta}</p></div>
              <span>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AIAnalysis = ({ openModal }) => (
  <div className="page-stack">
    <PageHeader icon="🤖" title="AI Analysis" subtitle="Personalized health insights and recommendations" />
    <div className="dashboard-card ai-main-card">
      <div className="ai-top">
        <div className="ai-icon big">✨</div>
        <div><h2>🟢 Health Status: Good</h2><p>Your recent health parameters are within the normal range.</p></div>
      </div>
      <div className="ai-insights">
        <div><strong>💚 Recovery</strong><p>Your recovery is progressing well.</p></div>
        <div><strong>💊 Medication</strong><p>Keep following your prescribed schedule.</p></div>
        <div><strong>💡 Recommendation</strong><p>Continue your recovery plan and regular checkups.</p></div>
      </div>
      <button className="primary-button" onClick={() => openModal("🤖 AI Health Analysis", "Your detailed AI-generated health analysis will appear here.")}>✨ View Full Analysis</button>
    </div>
  </div>
);

const Medicines = () => {
  const medicines = [
    ["Aspirin 75mg", "1 tablet • After breakfast", "✓ Taken", "taken"],
    ["Atorvastatin 10mg", "1 tablet • After dinner", "⏰ Pending", "pending"],
    ["Metoprolol 25mg", "1 tablet • Morning", "✓ Taken", "taken"],
  ];

  return (
    <div className="page-stack">
      <PageHeader icon="💊" title="Medicines" subtitle="Today's medication schedule" />
      <div className="dashboard-card">
        <div className="medicine-list large-list">
          {medicines.map(([name, instruction, status, type]) => (
            <div className="medicine-item" key={name}>
              <div className="medicine-icon">💊</div>
              <div><strong>{name}</strong><p>{instruction}</p></div>
              <span className={type}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Appointments = () => (
  <div className="page-stack">
    <PageHeader icon="📅" title="Appointments" subtitle="Your upcoming appointments" />
    <div className="dashboard-card">
      <div className="appointment-list">
        <div className="appointment large">
          <div className="appointment-date"><strong>20</strong><span>APR</span></div>
          <div><strong>Cardiology Follow-up</strong><p>Doctor appointment</p><small>10:30 AM • Room 204</small></div>
          <span className="appointment-status">Upcoming</span>
        </div>
        <div className="appointment large">
          <div className="appointment-date"><strong>25</strong><span>APR</span></div>
          <div><strong>Blood Test</strong><p>Diagnostic Center</p><small>09:00 AM</small></div>
          <span className="appointment-status">Scheduled</span>
        </div>
      </div>
    </div>
  </div>
);

const Alerts = () => (
  <div className="page-stack">
    <PageHeader icon="🔔" title="Alerts" subtitle="Important health reminders and updates" />
    <div className="dashboard-card">
      <div className="alert-list">
        <div className="alert-item warning"><span>💊</span><div><strong>Medicine Reminder</strong><p>Your medicine schedule needs attention.</p></div></div>
        <div className="alert-item info"><span>📅</span><div><strong>Appointment Reminder</strong><p>You have an upcoming appointment.</p></div></div>
        <div className="alert-item success"><span>💚</span><div><strong>Recovery Update</strong><p>Your recovery progress is improving.</p></div></div>
      </div>
    </div>
  </div>
);

const RecoveryPlan = () => (
  <div className="page-stack">
    <PageHeader icon="📝" title="Recovery Plan" subtitle="Your personalized recovery activities" />
    <div className="dashboard-card">
      <div className="recovery-plan-grid">
        <div className="plan-item completed"><div className="plan-check">✓</div><div><strong>🚶 Morning Walk</strong><p>30 minutes daily</p></div></div>
        <div className="plan-item completed"><div className="plan-check">✓</div><div><strong>💊 Medication</strong><p>Follow prescribed schedule</p></div></div>
        <div className="plan-item"><div className="plan-check">○</div><div><strong>🥗 Healthy Diet</strong><p>Follow recommended meal plan</p></div></div>
        <div className="plan-item"><div className="plan-check">○</div><div><strong>🩺 Regular Checkup</strong><p>Keep your next appointment</p></div></div>
      </div>
    </div>
  </div>
);

const DashboardHome = ({ openModal }) => (
  <div className="page-stack">
    <div className="welcome-section">
      <div><h1>Good Morning, Kunal 👋</h1><p>Here's your health summary and recovery progress.</p></div>
      <button className="primary-button" onClick={() => openModal("📊 Health Summary", "Your overall health status is currently good.")}>📊 View Summary</button>
    </div>

    <div className="top-grid">
      <div className="profile-card">
        <div className="patient-avatar">KS</div>
        <h2>Kunal Shah</h2>
        <p className="patient-age">Patient Profile</p>
        <div className="profile-details">
          <div><span>Patient ID</span><strong>83947</strong></div>
          <div><span>Blood Group</span><strong>O+</strong></div>
          <div><span>BMI</span><strong>24.5</strong></div>
          <div><span>Height</span><strong>5.8 ft</strong></div>
          <div><span>Weight</span><strong>55 kg</strong></div>
        </div>
        <button className="outline-button" onClick={() => openModal("👤 Patient Profile", "Here you can view and update your personal information.")}>👤 View Profile</button>
      </div>

      <div className="recovery-card">
        <div className="card-title">
          <div><h2>💚 Recovery Progress</h2><p>Your overall recovery status</p></div>
          <span className="date-select">This Month ⌄</span>
        </div>
        <div className="recovery-content">
          <div className="progress-circle"><div><strong>78%</strong><small>Recovered</small></div></div>
          <div className="recovery-info">
            <div className="progress-row"><span>Physical Recovery</span><strong>82%</strong></div>
            <div className="progress-bar"><div style={{ width: "82%" }} /></div>
            <div className="progress-row"><span>Medication</span><strong>90%</strong></div>
            <div className="progress-bar"><div style={{ width: "90%" }} /></div>
            <div className="progress-row"><span>Daily Activity</span><strong>65%</strong></div>
            <div className="progress-bar"><div style={{ width: "65%" }} /></div>
          </div>
        </div>
      </div>
    </div>

    <div className="dashboard-card">
      <div className="card-title"><div><h2>❤️ Health Overview</h2><p>Today's health measurements</p></div></div>
      <div className="health-cards compact">
        <div className="health-card sugar"><div className="health-icon">🩸</div><span>Blood Sugar</span><h3>80 <small>mg/dL</small></h3><label>✓ Normal</label></div>
        <div className="health-card heart"><div className="health-icon">❤️</div><span>Heart Rate</span><h3>98 <small>BPM</small></h3><label>✓ Normal</label></div>
        <div className="health-card pressure"><div className="health-icon">💓</div><span>Blood Pressure</span><h3>90 <small>/ 72 mmHg</small></h3><label>✓ Normal</label></div>
        <div className="health-card hemoglobin"><div className="health-icon">🩸</div><span>Hemoglobin</span><h3>14 <small>g/dL</small></h3><label>✓ Normal</label></div>
      </div>
    </div>
  </div>
);

const Patient = () => {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [modal, setModal] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const openModal = (title, content) => setModal({ title, content });

  const renderPage = () => {
    switch (activeMenu) {
      case "Health Overview": return <HealthOverview />;
      case "Recovery Progress": return <RecoveryProgress />;
      case "Health Records": return <HealthRecords openModal={openModal} />;
      case "AI Analysis": return <AIAnalysis openModal={openModal} />;
      case "Medicines": return <Medicines />;
      case "Appointments": return <Appointments />;
      case "Alerts": return <Alerts />;
      case "Recovery Plan": return <RecoveryPlan />;
      default: return <DashboardHome openModal={openModal} />;
    }
  };

  return (
    <div className={`patient-dashboard ${darkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
  <div className="brand-icon">⚕️</div>

  <div className="brand-text">
    <span>HealTrack AI</span>
    <small>Your Recovery, Our Support</small>
  </div>
</div>

        <div className="sidebar-scroll">
          <p className="menu-heading">MAIN MENU</p>
          <nav className="sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className={`menu-item ${activeMenu === item.name ? "active" : ""}`}
                onClick={() => setActiveMenu(item.name)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="bottom-button" onClick={() => openModal("⚙️ Settings", "Settings options are available here.")}>
            <span>⚙️</span><span>Settings</span>
          </button>
          <button className="logout-button" onClick={() => openModal("🚪 Logout", "Are you sure you want to logout?")}>
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Search health records..." />
          </div>
          <div className="header-right">
            <button className="mode-button" onClick={() => setDarkMode(!darkMode)} title="Change mode">
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button className="notification" onClick={() => openModal("🔔 Notifications", "You have 3 new health notifications.")}>
              🔔<span></span>
            </button>
            <div className="patient-header">
              <div className="patient-small-avatar">KS</div>
              <div><strong>Kunal Shah</strong><small>Patient</small></div>
              <span>⌄</span>
            </div>
          </div>
        </header>

        <section className="dashboard-container">
          {renderPage()}
        </section>
      </main>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <h2>{modal.title}</h2>
            <p>{modal.content}</p>
            <button className="primary-button" onClick={() => setModal(null)}>✓ Okay</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patient;