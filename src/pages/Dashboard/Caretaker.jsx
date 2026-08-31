import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./Caretaker.css";

function Caretaker() {
  const navigate = useNavigate();
  const [caretakerId, setCaretakerId] = useState(null);
  const [caretakerName, setCaretakerName] = useState("");
  const [patientId, setPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recoveryTasks, setRecoveryTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");

    if (!userId || userRole !== "caretaker") {
      navigate("/login");
      return;
    }

    setCaretakerId(userId);
    setCaretakerName(userName);

    // Fetch caretaker's assigned patient (for demo, using patient_id from profile)
    fetchCaretakerData(userId);
  }, [navigate]);

  const fetchCaretakerData = async (caretakerId) => {
    setLoading(true);
    try {
      const caretakerRes = await fetch(
        `${API_BASE}/api/caretaker/${caretakerId}/patient`
      );
      const caretakerInfo = await caretakerRes.json();

      if (!caretakerInfo.patient) {
        setLoading(false);
        return;
      }

      const patId = caretakerInfo.patient.id;
      setPatientId(patId);
      setDoctorInfo(caretakerInfo.doctor);

      const patientRes = await fetch(
        `${API_BASE}/api/patient/${patId}`
      );
      const patientInfo = await patientRes.json();
      setPatientData(patientInfo);

      const healthRes = await fetch(
        `${API_BASE}/api/health-record/${patId}`
      );
      const healthData = await healthRes.json();
      setHealthRecords(healthData.records || []);

      const medRes = await fetch(`${API_BASE}/api/medicines/${patId}`);
      const medData = await medRes.json();
      setMedicines(medData.medicines || []);

      const apptRes = await fetch(
        `${API_BASE}/api/appointments/${patId}`
      );
      const apptData = await apptRes.json();
      setAppointments(apptData.appointments || []);

      const taskRes = await fetch(
        `${API_BASE}/api/recovery-tasks/${patId}`
      );
      const taskData = await taskRes.json();
      setRecoveryTasks(taskData.tasks || []);

      const alertRes = await fetch(`${API_BASE}/api/alerts/${patId}`);
      const alertData = await alertRes.json();
      setAlerts(Array.isArray(alertData) ? alertData : alertData.alerts || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getRecoveryProgress = () => {
    if (recoveryTasks.length === 0) return 0;
    const completed = recoveryTasks.filter((t) => t.status === "completed").length;
    return Math.round((completed / recoveryTasks.length) * 100);
  };

  return (
    <div className={`caretaker-dashboard ${darkMode ? "dark-mode" : ""}`}>
      {/* Sidebar */}
      <aside className="caretaker-sidebar">
        <div className="caretaker-brand">
          <div className="caretaker-brand-icon">🏥</div>
          <div className="caretaker-brand-text">
            <span>HealTrack</span>
            <small>Caretaker</small>
          </div>
        </div>

        <div className="caretaker-menu-title">MENU</div>
        <nav className="caretaker-sidebar-menu">
          <button
            className={`caretaker-menu-item ${
              activeTab === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="caretaker-menu-icon">📊</span>
            Dashboard
          </button>
          <button
            className={`caretaker-menu-item ${
              activeTab === "vitals" ? "active" : ""
            }`}
            onClick={() => setActiveTab("vitals")}
          >
            <span className="caretaker-menu-icon">❤️</span>
            Vitals
          </button>
          <button
            className={`caretaker-menu-item ${
              activeTab === "medicines" ? "active" : ""
            }`}
            onClick={() => setActiveTab("medicines")}
          >
            <span className="caretaker-menu-icon">💊</span>
            Medicines
          </button>
          <button
            className={`caretaker-menu-item ${
              activeTab === "tasks" ? "active" : ""
            }`}
            onClick={() => setActiveTab("tasks")}
          >
            <span className="caretaker-menu-icon">✅</span>
            Tasks
          </button>
          <button
            className={`caretaker-menu-item ${
              activeTab === "appointments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("appointments")}
          >
            <span className="caretaker-menu-icon">📅</span>
            Appointments
          </button>
          <button
            className={`caretaker-menu-item ${
              activeTab === "alerts" ? "active" : ""
            }`}
            onClick={() => setActiveTab("alerts")}
          >
            <span className="caretaker-menu-icon">🔔</span>
            Alerts
          </button>
        </nav>

        <div className="caretaker-sidebar-bottom">
          <button
            className="caretaker-bottom-button"
            onClick={toggleDarkMode}
          >
            <span className="caretaker-menu-icon">
              {darkMode ? "☀️" : "🌙"}
            </span>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="caretaker-logout-button" onClick={handleLogout}>
            <span className="caretaker-menu-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="caretaker-main-content">
        {/* Header */}
        <header className="caretaker-header">
          <div className="caretaker-search">
            <span>🔍</span>
            <input type="text" placeholder="Search patient info..." />
          </div>

          <div className="caretaker-header-right">
            <button className="caretaker-mode-button" onClick={toggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button className="caretaker-notification">
              🔔
              {alerts.length > 0 && <span></span>}
            </button>
            <div className="caretaker-profile">
              <div className="caretaker-avatar">
                {caretakerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{caretakerName}</strong>
                <small>Caregiver</small>
              </div>
            </div>
          </div>
        </header>

        {/* Container */}
        <div className="caretaker-container">
          {/* Welcome Section */}
          {activeTab === "dashboard" && (
            <>
              <div className="caretaker-welcome">
                <div>
                  <div className="caretaker-welcome-small">HELLO THERE 👋</div>
                  <h1>Welcome back, {caretakerName}!</h1>
                  <p>Here's an overview of your patient's health status</p>
                </div>
              </div>

              {/* Top Grid */}
              <div className="caretaker-top-grid">
                {/* Connected Patient Card */}
                <div className="caretaker-card">
                  <div className="caretaker-card-title">
                    <div>
                      <h2>👤 Patient Information</h2>
                      <p>Current patient under care</p>
                    </div>
                  </div>

                  {patientData ? (
                    <div className="connected-patient">
                      <div className="patient-large-avatar">
                        {patientData.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="connected-patient-info">
                        <h3>{patientData.name}</h3>
                        <p>
                          Age: {patientData.age} • {patientData.gender}
                        </p>
                        <p>Recovery: {patientData.recoveryType || patientData.recovery_type}</p>
                        <p>
                          Doctor: {doctorInfo?.name || patientData.assignedDoctor?.name || "Not assigned"}
                        </p>
                        <p>
                          Care team: {doctorInfo?.specialization || "Monitoring support"}
                        </p>
                        <span className="patient-connected-badge">
                          ✓ Connected
                        </span>
                        <span className="online-status">🟢 Online</span>
                      </div>
                    </div>
                  ) : (
                    <p>No patient data available</p>
                  )}
                </div>

                {/* Recovery Progress */}
                <div className="caretaker-card">
                  <div className="caretaker-card-title">
                    <div>
                      <h2>📈 Recovery Progress</h2>
                      <p>Task completion status</p>
                    </div>
                  </div>

                  <div className="caretaker-progress">
                    <div className="caretaker-progress-circle">
                      <div>
                        <strong>{getRecoveryProgress()}%</strong>
                        <small>Complete</small>
                      </div>
                    </div>
                    <div className="progress-details">
                      <div className="progress-row">
                        <span>Total Tasks</span>
                        <strong>{recoveryTasks.length}</strong>
                      </div>
                      <div className="caretaker-progress-bar">
                        <div
                          style={{
                            width: `${getRecoveryProgress()}%`,
                          }}
                        ></div>
                      </div>

                      <div className="progress-row">
                        <span>Completed</span>
                        <strong>
                          {recoveryTasks.filter((t) => t.status === "completed")
                            .length}
                        </strong>
                      </div>

                      <div className="progress-row">
                        <span>Pending</span>
                        <strong>
                          {recoveryTasks.filter((t) => t.status === "pending")
                            .length}
                        </strong>
                      </div>

                      <button className="caretaker-outline-button">
                        View All Tasks
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Grid */}
              <div className="caretaker-middle-grid">
                {/* Upcoming Appointments */}
                <div className="caretaker-card">
                  <div className="caretaker-card-title">
                    <div>
                      <h2>📅 Appointments</h2>
                      <p>Upcoming medical visits</p>
                    </div>
                    <span>{appointments.length}</span>
                  </div>

                  {appointments.length === 0 ? (
                    <p style={{ color: "#9690a2", fontSize: "12px" }}>
                      No appointments scheduled
                    </p>
                  ) : (
                    appointments.slice(0, 3).map((apt, idx) => (
                      <div key={idx} className="caretaker-appointment">
                        <div className="appointment-date">
                          <strong>
                            {new Date(apt.date).getDate()}
                          </strong>
                          <span>
                            {new Date(apt.date).toLocaleString("default", {
                              month: "short",
                            })}
                          </span>
                        </div>
                        <div>
                          <strong>{apt.title}</strong>
                          <p>{apt.subtitle}</p>
                          <small>{apt.time || "N/A"}</small>
                        </div>
                        <span className="appointment-status">
                          {apt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Recent Alerts */}
                <div className="caretaker-card">
                  <div className="caretaker-card-title">
                    <div>
                      <h2>🔔 Alerts</h2>
                      <p>Health warnings</p>
                    </div>
                    <div className="alert-count">{alerts.length}</div>
                  </div>

                  {alerts.length === 0 ? (
                    <p style={{ color: "#9690a2", fontSize: "12px" }}>
                      No alerts at the moment
                    </p>
                  ) : (
                    alerts.slice(0, 3).map((alert, idx) => (
                      <div
                        key={idx}
                        className={`caretaker-alert ${alert.type}`}
                      >
                        <span>
                          {alert.type === "warning"
                            ? "⚠️"
                            : alert.type === "info"
                            ? "ℹ️"
                            : "✓"}
                        </span>
                        <div>
                          <strong>{alert.title}</strong>
                          <p>{alert.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lower Grid */}
              <div className="caretaker-lower-grid">
                {/* Medicines */}
                <div className="caretaker-card">
                  <div className="caretaker-card-title">
                    <div>
                      <h2>💊 Medicines</h2>
                      <p>Today's medication schedule</p>
                    </div>
                    <span>{medicines.length}</span>
                  </div>

                  {medicines.length === 0 ? (
                    <p style={{ color: "#9690a2", fontSize: "12px" }}>
                      No medicines scheduled
                    </p>
                  ) : (
                    medicines.slice(0, 3).map((med, idx) => (
                      <div key={idx} className="health-record">
                        <div className="record-icon">💊</div>
                        <div>
                          <strong>{med.name}</strong>
                          <p>{med.instruction}</p>
                        </div>
                        <span
                          style={{
                            background:
                              med.status === "taken"
                                ? "#eaf9f2"
                                : "#fff6e5",
                            color:
                              med.status === "taken"
                                ? "#209364"
                                : "#d88a16",
                          }}
                        >
                          {med.status.toUpperCase()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* AI Insights */}
                <div className="caretaker-card ai-insights-card">
                  <div className="caretaker-card-title">
                    <div>
                      <h2>🤖 AI Insights</h2>
                      <p>Personalized recommendations</p>
                    </div>
                    <div className="ai-insights-icon">✨</div>
                  </div>

                  <div className="ai-insight-message">
                    <strong>Patient Recovery Status</strong>
                    <p>
                      Based on recent vitals and activity, the patient is
                      showing steady progress. Continue with current medication
                      schedule.
                    </p>
                    <div className="ai-insight-tip">
                      💡 <strong>Tip:</strong> Ensure patient drinks 2-3 liters
                      of water daily and maintains regular sleep schedule.
                    </div>
                  </div>

                  <button className="caretaker-ai-button">
                    Get More Insights →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Vitals Tab */}
          {activeTab === "vitals" && (
            <div>
              <div className="caretaker-page-heading">
                <h1>❤️ Health Vitals</h1>
                <p>Patient's vital signs and health parameters</p>
              </div>

              {healthRecords.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                  <p style={{ color: "#9690a2", fontSize: "14px" }}>
                    No health records available
                  </p>
                </div>
              ) : (
                <div className="full-health-grid">
                  {healthRecords.slice(0, 4).map((record, idx) => (
                    <div key={idx} className="health-big-card">
                      <span>
                        {idx === 0
                          ? "🩸"
                          : idx === 1
                          ? "❤️"
                          : idx === 2
                          ? "🫀"
                          : "🔴"}
                      </span>
                      <strong>
                        {idx === 0
                          ? record.blood_sugar
                          : idx === 1
                          ? record.heart_rate
                          : idx === 2
                          ? record.systolic
                          : record.hemoglobin}
                      </strong>
                      <span>
                        {idx === 0
                          ? "Blood Sugar (mg/dL)"
                          : idx === 1
                          ? "Heart Rate (BPM)"
                          : idx === 2
                          ? "Systolic (mmHg)"
                          : "Hemoglobin (g/dL)"}
                      </span>
                      <small>✓ Normal</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medicines Tab */}
          {activeTab === "medicines" && (
            <div>
              <div className="caretaker-page-heading">
                <h1>💊 Medications</h1>
                <p>Complete medication schedule and history</p>
              </div>

              <div className="caretaker-card">
                {medicines.length === 0 ? (
                  <p style={{ color: "#9690a2", fontSize: "14px" }}>
                    No medicines found
                  </p>
                ) : (
                  medicines.map((med, idx) => (
                    <div key={idx} className="health-record">
                      <div className="record-icon">💊</div>
                      <div>
                        <strong>{med.name}</strong>
                        <p>{med.instruction}</p>
                      </div>
                      <span
                        style={{
                          background:
                            med.status === "taken" ? "#eaf9f2" : "#fff6e5",
                          color:
                            med.status === "taken" ? "#209364" : "#d88a16",
                        }}
                      >
                        {med.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div>
              <div className="caretaker-page-heading">
                <h1>✅ Recovery Tasks</h1>
                <p>Daily recovery and rehabilitation tasks</p>
              </div>

              <div className="caretaker-card">
                {recoveryTasks.length === 0 ? (
                  <p style={{ color: "#9690a2", fontSize: "14px" }}>
                    No tasks assigned
                  </p>
                ) : (
                  recoveryTasks.map((task, idx) => (
                    <div key={idx} className="health-record">
                      <div className="record-icon">📋</div>
                      <div>
                        <strong>{task.name}</strong>
                        <p>Date: {new Date(task.date).toDateString()}</p>
                      </div>
                      <span
                        style={{
                          background:
                            task.status === "completed"
                              ? "#eaf9f2"
                              : "#fff6e5",
                          color:
                            task.status === "completed"
                              ? "#209364"
                              : "#d88a16",
                        }}
                      >
                        {task.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div>
              <div className="caretaker-page-heading">
                <h1>📅 Appointments</h1>
                <p>Scheduled medical visits and consultations</p>
              </div>

              <div className="caretaker-card">
                {appointments.length === 0 ? (
                  <p style={{ color: "#9690a2", fontSize: "14px" }}>
                    No appointments scheduled
                  </p>
                ) : (
                  appointments.map((apt, idx) => (
                    <div key={idx} className="caretaker-appointment">
                      <div className="appointment-date">
                        <strong>
                          {new Date(apt.date).getDate()}
                        </strong>
                        <span>
                          {new Date(apt.date).toLocaleString("default", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div>
                        <strong>{apt.title}</strong>
                        <p>{apt.subtitle}</p>
                        <small>{apt.time || "N/A"}</small>
                      </div>
                      <span className="appointment-status">
                        {apt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === "alerts" && (
            <div>
              <div className="caretaker-page-heading">
                <h1>🔔 Health Alerts</h1>
                <p>Critical health warnings and notifications</p>
              </div>

              <div className="caretaker-card">
                {alerts.length === 0 ? (
                  <p style={{ color: "#9690a2", fontSize: "14px" }}>
                    No alerts at the moment
                  </p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`caretaker-alert ${alert.type}`}
                    >
                      <span>
                        {alert.type === "warning"
                          ? "⚠️"
                          : alert.type === "info"
                          ? "ℹ️"
                          : "✓"}
                      </span>
                      <div>
                        <strong>{alert.title}</strong>
                        <p>{alert.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Caretaker;