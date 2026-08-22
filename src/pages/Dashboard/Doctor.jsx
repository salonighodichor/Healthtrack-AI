import { useState } from "react";
import "./Doctor.css";

const menuItems = [
  { name: "Dashboard", icon: "🏠" },
  { name: "Patient List", icon: "👥" },
  { name: "Patient Recovery Status", icon: "📈" },
  { name: "Appointments", icon: "📅" },
  { name: "Health Records", icon: "📄" },
  { name: "AI Analysis", icon: "🤖" },
  { name: "Alerts", icon: "🔔" },
  { name: "Settings", icon: "⚙️" },
];

/* ================= PAGE HEADER ================= */

const PageHeader = ({ icon, title, subtitle }) => (
  <div className="page-heading">
    <div>
      <h1>
        {icon} {title}
      </h1>
      <p>{subtitle}</p>
    </div>
  </div>
);

/* ================= PATIENT LIST ================= */

const PatientList = () => {
  const patients = [
    ["AK", "Aarav Kumar", "45", "Cardiology", "78%", "Stable"],
    ["PS", "Priya Sharma", "38", "General", "85%", "Improving"],
    ["RM", "Rohan Mehta", "52", "Diabetes", "65%", "Monitoring"],
    ["NS", "Neha Singh", "41", "Cardiology", "92%", "Excellent"],
  ];

  return (
    <div className="page-stack">
      <PageHeader
        icon="👥"
        title="Patient List"
        subtitle="Manage and monitor your patients"
      />

      <div className="dashboard-card">
        <div className="card-title">
          <div>
            <h2>👥 All Patients</h2>
            <p>Recently registered patients</p>
          </div>

          <span className="date-select">View All ⌄</span>
        </div>

        <div className="patient-table">
          <div className="table-header">
            <span>Patient</span>
            <span>Age</span>
            <span>Condition</span>
            <span>Recovery</span>
            <span>Status</span>
          </div>

          {patients.map(
            ([initials, name, age, condition, recovery, status]) => (
              <div className="patient-row" key={name}>
                <div className="patient-name">
                  <div className="patient-table-avatar">
                    {initials}
                  </div>

                  <strong>{name}</strong>
                </div>

                <span>{age}</span>
                <span>{condition}</span>

                <div className="table-progress">
                  <strong>{recovery}</strong>

                  <div className="small-progress">
                    <div style={{ width: recovery }}></div>
                  </div>
                </div>

                <span className="status-badge">{status}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= RECOVERY STATUS ================= */

const RecoveryStatus = () => (
  <div className="page-stack">
    <PageHeader
      icon="📈"
      title="Patient Recovery Status"
      subtitle="Track your patients' recovery progress"
    />

    <div className="dashboard-card recovery-main-card">
      <div className="recovery-main">

        <div className="progress-circle large">
          <div>
            <strong>82%</strong>
            <small>Overall</small>
          </div>
        </div>

        <div className="recovery-details">
          <h2>💙 Overall Patient Recovery</h2>

          <p>
            Your patients are showing steady recovery progress.
          </p>

          <div className="progress-item">
            <div className="progress-row">
              <span>Physical Recovery</span>
              <strong>86%</strong>
            </div>

            <div className="progress-bar">
              <div style={{ width: "86%" }}></div>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-row">
              <span>Medication Adherence</span>
              <strong>91%</strong>
            </div>

            <div className="progress-bar">
              <div style={{ width: "91%" }}></div>
            </div>
          </div>

          <div className="progress-item">
            <div className="progress-row">
              <span>Daily Activity</span>
              <strong>74%</strong>
            </div>

            <div className="progress-bar">
              <div style={{ width: "74%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="content-grid three-col">

      <div className="mini-stat">
        <span>💚</span>
        <strong>18</strong>
        <small>Improving Patients</small>
      </div>

      <div className="mini-stat">
        <span>⚠️</span>
        <strong>5</strong>
        <small>Need Monitoring</small>
      </div>

      <div className="mini-stat">
        <span>⭐</span>
        <strong>12</strong>
        <small>Excellent Recovery</small>
      </div>

    </div>
  </div>
);

/* ================= APPOINTMENTS ================= */

const Appointments = () => (
  <div className="page-stack">
    <PageHeader
      icon="📅"
      title="Appointments"
      subtitle="Manage your upcoming patient appointments"
    />

    <div className="dashboard-card">

      <div className="appointment-list">

        <div className="appointment large">

          <div className="appointment-date">
            <strong>21</strong>
            <span>AUG</span>
          </div>

          <div>
            <strong>Aarav Kumar</strong>
            <p>Cardiology Follow-up</p>
            <small>10:30 AM • Room 204</small>
          </div>

          <span className="appointment-status">
            Upcoming
          </span>

        </div>

        <div className="appointment large">

          <div className="appointment-date">
            <strong>21</strong>
            <span>AUG</span>
          </div>

          <div>
            <strong>Priya Sharma</strong>
            <p>General Checkup</p>
            <small>12:00 PM • Room 205</small>
          </div>

          <span className="appointment-status">
            Scheduled
          </span>

        </div>

        <div className="appointment large">

          <div className="appointment-date">
            <strong>22</strong>
            <span>AUG</span>
          </div>

          <div>
            <strong>Rohan Mehta</strong>
            <p>Diabetes Consultation</p>
            <small>09:30 AM • Room 201</small>
          </div>

          <span className="appointment-status">
            Scheduled
          </span>

        </div>

      </div>
    </div>
  </div>
);

/* ================= HEALTH RECORDS ================= */

const HealthRecords = () => (
  <div className="page-stack">

    <PageHeader
      icon="📄"
      title="Health Records"
      subtitle="Review patient medical reports and documents"
    />

    <div className="dashboard-card">

      <div className="record-list large-list">

        <div className="record-item">

          <div className="record-icon">🩸</div>

          <div>
            <strong>Aarav Kumar - Blood Report</strong>
            <p>Today • 2 MB</p>
          </div>

          <span>→</span>

        </div>

        <div className="record-item">

          <div className="record-icon">❤️</div>

          <div>
            <strong>Priya Sharma - ECG Report</strong>
            <p>Yesterday • 5 MB</p>
          </div>

          <span>→</span>

        </div>

        <div className="record-item">

          <div className="record-icon">🧠</div>

          <div>
            <strong>Rohan Mehta - MRI Report</strong>
            <p>20 Aug 2026 • 12 MB</p>
          </div>

          <span>→</span>

        </div>

      </div>
    </div>
  </div>
);

/* ================= AI ANALYSIS ================= */

const AIAnalysis = () => (
  <div className="page-stack">

    <PageHeader
      icon="🤖"
      title="AI Analysis"
      subtitle="AI-powered patient insights and recommendations"
    />

    <div className="dashboard-card ai-main-card">

      <div className="ai-top">

        <div className="ai-icon big">
          ✨
        </div>

        <div>
          <h2>🟢 Patient Health Analysis</h2>

          <p>
            AI analysis has identified important recovery trends
            among your patients.
          </p>
        </div>

      </div>

      <div className="ai-insights">

        <div>
          <strong>💙 Recovery</strong>
          <p>
            Most patients are showing positive recovery progress.
          </p>
        </div>

        <div>
          <strong>💊 Medication</strong>
          <p>
            Medication adherence is high among active patients.
          </p>
        </div>

        <div>
          <strong>💡 Recommendation</strong>
          <p>
            Review patients requiring additional monitoring.
          </p>
        </div>

      </div>

      <button className="primary-button">
        ✨ View Full Analysis
      </button>

    </div>
  </div>
);

/* ================= ALERTS ================= */

const Alerts = () => (
  <div className="page-stack">

    <PageHeader
      icon="🔔"
      title="Alerts"
      subtitle="Important patient reminders and updates"
    />

    <div className="dashboard-card">

      <div className="alert-list">

        <div className="alert-item warning">

          <span>⚠️</span>

          <div>
            <strong>Patient Monitoring</strong>
            <p>5 patients need additional monitoring.</p>
          </div>

        </div>

        <div className="alert-item info">

          <span>📅</span>

          <div>
            <strong>Appointment Reminder</strong>
            <p>You have 3 upcoming appointments today.</p>
          </div>

        </div>

        <div className="alert-item success">

          <span>💙</span>

          <div>
            <strong>Recovery Update</strong>
            <p>12 patients have shown improved recovery.</p>
          </div>

        </div>

      </div>
    </div>
  </div>
);

/* ================= SETTINGS ================= */

const Settings = ({ darkMode, setDarkMode }) => (
  <div className="page-stack">

    <PageHeader
      icon="⚙️"
      title="Settings"
      subtitle="Manage your dashboard preferences"
    />

    <div className="dashboard-card settings-card">

      <div className="setting-row">

        <div>
          <strong>Appearance</strong>
          <p>
            Switch between light and dark mode
          </p>
        </div>

        <button
          className="setting-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

      </div>

    </div>
  </div>
);

/* ================= DASHBOARD HOME ================= */

const DashboardHome = () => (
  <div className="page-stack">

    <div className="welcome-section">

      <div>
        <h1>Good Morning, Dr. Arjun 👋</h1>

        <p>
          Here's your patient overview and today's healthcare summary.
        </p>
      </div>

      <button className="primary-button">
        📊 View Summary
      </button>

    </div>

    <div className="top-grid">

      {/* DOCTOR PROFILE */}

      <div className="profile-card">

        <div className="patient-avatar doctor-avatar">
          AS
        </div>

        <h2>Dr. Arjun Sharma</h2>

        <p className="patient-age">
          Cardiologist
        </p>

        <div className="profile-details">

          <div>
            <span>Doctor ID</span>
            <strong>DR20458</strong>
          </div>

          <div>
            <span>Specialization</span>
            <strong>Cardiology</strong>
          </div>

          <div>
            <span>Experience</span>
            <strong>8 Years</strong>
          </div>

          <div>
            <span>Patients</span>
            <strong>35</strong>
          </div>

          <div>
            <span>Rating</span>
            <strong>4.9 ⭐</strong>
          </div>

        </div>

        <button className="outline-button">
          👨‍⚕️ View Profile
        </button>

      </div>


      {/* PATIENT RECOVERY */}

      <div className="recovery-card">

        <div className="card-title">

          <div>
            <h2>💙 Patient Recovery Status</h2>
            <p>Overall recovery of your patients</p>
          </div>

          <span className="date-select">
            This Month ⌄
          </span>

        </div>

        <div className="recovery-content">

          <div className="progress-circle">

            <div>
              <strong>82%</strong>
              <small>Recovery</small>
            </div>

          </div>

          <div className="recovery-info">

            <div className="progress-row">
              <span>Physical Recovery</span>
              <strong>86%</strong>
            </div>

            <div className="progress-bar">
              <div style={{ width: "86%" }}></div>
            </div>

            <div className="progress-row">
              <span>Medication</span>
              <strong>91%</strong>
            </div>

            <div className="progress-bar">
              <div style={{ width: "91%" }}></div>
            </div>

            <div className="progress-row">
              <span>Daily Activity</span>
              <strong>74%</strong>
            </div>

            <div className="progress-bar">
              <div style={{ width: "74%" }}></div>
            </div>

          </div>

        </div>
      </div>

    </div>


    {/* TODAY'S OVERVIEW */}

    <div className="dashboard-card">

      <div className="card-title">

        <div>
          <h2>📊 Today's Overview</h2>
          <p>Your practice summary for today</p>
        </div>

      </div>

      <div className="health-cards compact">

        <div className="health-card patients">

          <div className="health-icon">
            👥
          </div>

          <span>Total Patients</span>

          <h3>35</h3>

          <label>✓ Active</label>

        </div>

        <div className="health-card appointments">

          <div className="health-icon">
            📅
          </div>

          <span>Today's Appointments</span>

          <h3>8</h3>

          <label>✓ Scheduled</label>

        </div>

        <div className="health-card recovery">

          <div className="health-icon">
            📈
          </div>

          <span>Avg. Recovery</span>

          <h3>82%</h3>

          <label>✓ Improving</label>

        </div>

        <div className="health-card reports">

          <div className="health-icon">
            📄
          </div>

          <span>Pending Reports</span>

          <h3>6</h3>

          <label>⚠ Review</label>

        </div>

      </div>
    </div>


    {/* MIDDLE SECTION */}

    <div className="middle-grid">

      <div className="dashboard-card">

        <div className="card-title">

          <div>
            <h2>👥 Recent Patients</h2>
            <p>Recently viewed patients</p>
          </div>

        </div>

        <div className="record-list">

          <div className="record-item">

            <div className="record-icon">
              AK
            </div>

            <div>
              <strong>Aarav Kumar</strong>
              <p>Cardiology • Recovery 78%</p>
            </div>

            <span>→</span>

          </div>

          <div className="record-item">

            <div className="record-icon">
              PS
            </div>

            <div>
              <strong>Priya Sharma</strong>
              <p>General • Recovery 85%</p>
            </div>

            <span>→</span>

          </div>

          <div className="record-item">

            <div className="record-icon">
              RM
            </div>

            <div>
              <strong>Rohan Mehta</strong>
              <p>Diabetes • Recovery 65%</p>
            </div>

            <span>→</span>

          </div>

        </div>
      </div>


      {/* AI */}

      <div className="dashboard-card ai-card">

        <div className="card-title">

          <div>
            <h2>🤖 AI Patient Insights</h2>
            <p>Smart health analysis</p>
          </div>

        </div>

        <div className="ai-message">

          <strong>💙 AI Recommendation</strong>

          <p>
            5 patients may require additional monitoring
            based on their recent health records.
          </p>

          <div className="ai-warning">
            ⚠ Review recommended patients.
          </div>

          <button className="ai-button">
            View Analysis →
          </button>

        </div>

      </div>
    </div>


    {/* LOWER SECTION */}

    <div className="lower-grid">

      {/* MEDICATION */}

      <div className="dashboard-card">

        <div className="card-title">

          <div>
            <h2>💊 Medication Alerts</h2>
            <p>Patient medication updates</p>
          </div>

        </div>

        <div className="medicine-item">

          <div className="medicine-icon">
            💊
          </div>

          <div>
            <strong>Aarav Kumar</strong>
            <p>Medication adherence: 92%</p>
          </div>

          <span className="taken">
            Good
          </span>

        </div>

        <div className="medicine-item">

          <div className="medicine-icon">
            💊
          </div>

          <div>
            <strong>Rohan Mehta</strong>
            <p>Missed medication</p>
          </div>

          <span className="pending">
            Review
          </span>

        </div>

      </div>


      {/* APPOINTMENTS */}

      <div className="dashboard-card">

        <div className="card-title">

          <div>
            <h2>📅 Upcoming Appointments</h2>
            <p>Today's schedule</p>
          </div>

        </div>

        <div className="appointment">

          <div className="appointment-date">
            <strong>10</strong>
            <span>AM</span>
          </div>

          <div>
            <strong>Aarav Kumar</strong>
            <p>Cardiology Follow-up</p>
          </div>

          <span className="appointment-status">
            Upcoming
          </span>

        </div>

        <div className="appointment">

          <div className="appointment-date">
            <strong>12</strong>
            <span>PM</span>
          </div>

          <div>
            <strong>Priya Sharma</strong>
            <p>General Checkup</p>
          </div>

          <span className="appointment-status">
            Scheduled
          </span>

        </div>

      </div>


      {/* ALERTS */}

      <div className="dashboard-card">

        <div className="card-title">

          <div>
            <h2>🔔 Alerts</h2>
            <p>Important updates</p>
          </div>

        </div>

        <div className="alert-item warning">

          <span>⚠️</span>

          <div>
            <strong>5 Patients</strong>
            <p>Need monitoring</p>
          </div>

        </div>

        <div className="alert-item info">

          <span>📄</span>

          <div>
            <strong>6 Reports</strong>
            <p>Pending review</p>
          </div>

        </div>

      </div>

    </div>

  </div>
);


/* ================= MAIN COMPONENT ================= */

const Doctor = () => {

  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const [darkMode, setDarkMode] = useState(false);


  const renderPage = () => {

    switch (activeMenu) {

      case "Patient List":
        return <PatientList />;

      case "Patient Recovery Status":
        return <RecoveryStatus />;

      case "Appointments":
        return <Appointments />;

      case "Health Records":
        return <HealthRecords />;

      case "AI Analysis":
        return <AIAnalysis />;

      case "Alerts":
        return <Alerts />;

      case "Settings":
        return (
          <Settings
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        );

      default:
        return <DashboardHome />;
    }
  };


  return (

    <div
      className={`doctor-dashboard ${
        darkMode ? "dark-mode" : ""
      }`}
    >

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ⚕️
          </div>

          <div className="brand-text">

            <span>HealTrack AI</span>

            <small>
              Your Recovery, Our Support
            </small>

          </div>

        </div>


        <div className="sidebar-scroll">

          <p className="menu-heading">
            MAIN MENU
          </p>

          <nav className="sidebar-menu">

            {menuItems.map((item) => (

              <button
                key={item.name}
                className={`menu-item ${
                  activeMenu === item.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveMenu(item.name)
                }
              >

                <span className="menu-icon">
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>

              </button>

            ))}

          </nav>

        </div>


        {/* ONLY LOGOUT AT BOTTOM */}

        <div className="sidebar-bottom">

          <button className="logout-button">

            <span>🚪</span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* ================= MAIN ================= */}

      <main className="main-content">

        <header className="top-header">

          <div className="search-box">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search patients, records..."
            />

          </div>


          <div className="header-right">

            {/* DARK / LIGHT MODE */}

            <button
              className="mode-button"
              onClick={() =>
                setDarkMode(!darkMode)
              }
              title={
                darkMode
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {darkMode ? "☀️" : "🌙"}
            </button>


            <button className="notification">

              🔔

              <span></span>

            </button>


            <div className="patient-header">

              <div className="patient-small-avatar doctor-small-avatar">
                AS
              </div>

              <div>

                <strong>
                  Dr. Arjun Sharma
                </strong>

                <small>
                  Doctor
                </small>

              </div>

              <span>
                ⌄
              </span>

            </div>

          </div>

        </header>


        <section className="dashboard-container">

          {renderPage()}

        </section>

      </main>

    </div>
  );
};

export default Doctor;