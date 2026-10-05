import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
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
  const [insights, setInsights] = useState(null);
  const [insightsError, setInsightsError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

      // Caretaker AI Insights — derived server-side from this patient's data only
      try {
        const insightRes = await fetch(
          `${API_BASE}/api/caretaker/${caretakerId}/insights?days=7`
        );
        if (insightRes.ok) {
          setInsights(await insightRes.json());
          setInsightsError("");
        }
      } catch (insightErr) {
        setInsightsError("Unable to load AI insights right now.");
      }
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

  // Escape closes the logout confirmation without logging out
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogoutConfirm]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // DB stores task status as "done" or "pending" (older rows use "completed").
  const isTaskDone = (task) =>
    String(task.status || "").toLowerCase() === "done" ||
    String(task.status || "").toLowerCase() === "completed";

  const getRecoveryProgress = () => {
    if (recoveryTasks.length === 0) return 0;
    const completed = recoveryTasks.filter(isTaskDone).length;
    return Math.round((completed / recoveryTasks.length) * 100);
  };

  // Chart-ready view of the server-side trend series
  const insightTrends = (insights?.trends || []).map((t) => ({
    ...t,
    label: new Date(t.date).toLocaleDateString("default", {
      month: "short",
      day: "numeric",
    }),
  }));
  const insightHasRecovery = insightTrends.some(
    (t) => t.recovery_percent !== null && t.recovery_percent !== undefined
  );
  const insightHasVitals = insightTrends.some(
    (t) => t.heart_rate !== null && t.heart_rate !== undefined
  );

  // Alerts: keep only warnings / missed medicines / abnormal readings /
  // critical notices. Appointment reminders, medicine reminders and task
  // reminders are dropped because those sections already cover them.
  const ALERT_KEEP_TYPES = ["warning", "critical", "danger"];
  const ALERT_DUPLICATE_TITLES =
    /^(Medicine Reminder|Recovery Task Missed|Appointment\b)/i;
  const actionableAlerts = (() => {
    const seen = new Set();
    return alerts.filter((a) => {
      const type = String(a.type || "").toLowerCase();
      const title = String(a.title || "");
      if (!ALERT_KEEP_TYPES.includes(type)) return false;
      if (ALERT_DUPLICATE_TITLES.test(title)) return false;
      const key = title.toLowerCase();
      if (seen.has(key)) return false; // collapse repeated alert titles
      seen.add(key);
      return true;
    });
  })();

  // Medicines: the card is a "today's schedule" view, so only keep the
  // current day's rows (falling back to the most recent day available).
  const todayMedicines = (() => {
    if (medicines.length === 0) return [];
    const today = new Date().toISOString().slice(0, 10);
    const todays = medicines.filter((m) => m.date === today);
    if (todays.length > 0) return todays;
    const latest = medicines.reduce(
      (acc, m) => (m.date > acc ? m.date : acc),
      medicines[0].date
    );
    return medicines.filter((m) => m.date === latest);
  })();

  // One-line summary built from the assigned patient's latest real readings
  const latestHealthSummary = (() => {
    const latest = insights?.latest;
    if (!insights?.has_data || !latest) return "No health records yet";
    const parts = [];
    if (latest.blood_sugar?.value != null)
      parts.push(`Sugar ${Math.round(latest.blood_sugar.value)} mg/dL`);
    if (latest.heart_rate?.value != null)
      parts.push(`Pulse ${Math.round(latest.heart_rate.value)} BPM`);
    if (latest.blood_pressure?.systolic != null)
      parts.push(
        `BP ${Math.round(latest.blood_pressure.systolic)}/${Math.round(
          latest.blood_pressure.diastolic
        )}`
      );
    if (latest.hemoglobin?.value != null)
      parts.push(`Hb ${latest.hemoglobin.value} g/dL`);
    if (latest.spo2?.value != null)
      parts.push(`SpO2 ${Math.round(latest.spo2.value)}%`);
    return parts.join(" · ") || "No health records yet";
  })();

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
          <button
            className="caretaker-logout-button"
            onClick={() => setShowLogoutConfirm(true)}
          >
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
              {actionableAlerts.length > 0 && <span></span>}
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

                  {loading && !patientData ? (
                    <p>Loading patient details...</p>
                  ) : patientData ? (
                    <div className="connected-patient">
                      <div className="patient-large-avatar">
                        {patientData.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="connected-patient-info">
                        <h3>{patientData.name}</h3>
                        <p>
                          Age: {patientData.age} • {patientData.gender}
                        </p>
                        <p>
                          Recovery:{" "}
                          {patientData.recovery_type || "Not specified"}
                        </p>
                        <p>
                          Doctor: {doctorInfo?.name || "Not assigned"}
                        </p>
                        <p>
                          Care team:{" "}
                          {doctorInfo?.specialization || "Monitoring support"}
                        </p>
                        <p>
                          Recovery Status:{" "}
                          {insights?.recovery?.overall_health ||
                            (insights?.has_data ? "Recorded" : "No data")}
                        </p>
                        <p>Latest Health Summary: {latestHealthSummary}</p>
                        <span className="patient-connected-badge">
                          ✓ Connected
                        </span>
                        <span className="online-status">🟢 Online</span>
                      </div>
                    </div>
                  ) : (
                    <p>No patient assigned to this caretaker</p>
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
                        <strong>{recoveryTasks.filter(isTaskDone).length}</strong>
                      </div>

                      <div className="progress-row">
                        <span>Pending</span>
                        <strong>
                          {recoveryTasks.filter((t) => !isTaskDone(t)).length}
                        </strong>
                      </div>

                      <button
                        className="caretaker-outline-button"
                        onClick={() => setActiveTab("tasks")}
                      >
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
                    <div className="alert-count">{actionableAlerts.length}</div>
                  </div>

                  {actionableAlerts.length === 0 ? (
                    <p style={{ color: "#9690a2", fontSize: "12px" }}>
                      No alerts at the moment
                    </p>
                  ) : (
                    actionableAlerts.slice(0, 3).map((alert, idx) => (
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
                    <span>{todayMedicines.length}</span>
                  </div>

                  {todayMedicines.length === 0 ? (
                    <p style={{ color: "#9690a2", fontSize: "12px" }}>
                      No medicines scheduled
                    </p>
                  ) : (
                    todayMedicines.slice(0, 3).map((med, idx) => (
                      <div key={idx} className="health-record">
                        <div className="record-icon">💊</div>
                        <div>
                          <strong>{med.name}</strong>
                          <p>
                            {med.frequency} • {med.timing || "Any time"}
                          </p>
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
                    <strong>
                      {patientData ? `${patientData.name}'s Recovery Status` : "Recovery Status"}
                    </strong>
                    <p>
                      {insights?.ai_summary ||
                        "No insights available yet for this patient."}
                    </p>
                    {insights?.health_tips?.length > 0 && (
                      <div className="ai-insight-tip">
                        💡 <strong>Tip:</strong> {insights.health_tips[0]}
                      </div>
                    )}
                  </div>

                  <button
                    className="caretaker-ai-button"
                    onClick={() => setActiveTab("insights")}
                  >
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
                        <p>
                          {med.date} • {med.frequency} •{" "}
                          {med.timing || "Any time"}
                        </p>
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
                          background: isTaskDone(task) ? "#eaf9f2" : "#fff6e5",
                          color: isTaskDone(task) ? "#209364" : "#d88a16",
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

          {/* AI Insights Tab */}
          {activeTab === "insights" && (
            <div>
              <div className="caretaker-page-heading">
                <h1>🤖 AI Insights</h1>
                <p>Detailed progress, adherence and vitals summary</p>
              </div>

              {insightsError && (
                <p
                  style={{
                    color: "#d88a16",
                    fontSize: "13px",
                    padding: "12px 0",
                  }}
                >
                  {insightsError}
                </p>
              )}

              {!insights && !insightsError && (
                <p style={{ color: "#9690a2", fontSize: "14px" }}>
                  Loading insights...
                </p>
              )}

              {insights && (
                <>
                  <div className="caretaker-insight-metrics">
                    <div className="caretaker-card">
                      <strong>
                        {insights.recovery?.recovery_percent ?? "—"}%
                      </strong>
                      <span>Recovery Progress</span>
                    </div>
                    <div className="caretaker-card">
                      <strong>{insights.medication?.percent ?? 0}%</strong>
                      <span>
                        Medication Adherence ({insights.medication?.taken ?? 0}/
                        {insights.medication?.total ?? 0})
                      </span>
                    </div>
                    <div className="caretaker-card">
                      <strong>
                        {insights.recovery?.completion_percent ?? 0}%
                      </strong>
                      <span>
                        Task Completion ({insights.recovery?.completed_tasks ?? 0}
                        /{insights.recovery?.total_tasks ?? 0})
                      </span>
                    </div>
                    <div className="caretaker-card">
                      <strong>{insights.risk?.level ?? "—"}</strong>
                      <span>Risk Level</span>
                    </div>
                  </div>

                  {/* Recovery progress graph */}
                  <div className="caretaker-card caretaker-chart-card">
                    <div className="caretaker-card-title">
                      <div>
                        <h2>📈 Recovery Progress</h2>
                        <p>Last 7 days</p>
                      </div>
                    </div>
                    {insightHasRecovery ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={insightTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="recovery_percent"
                            name="Recovery %"
                            stroke="#667eea"
                            strokeWidth={2}
                            connectNulls
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p style={{ color: "#9690a2", fontSize: "12px" }}>
                        Not enough recovery readings yet.
                      </p>
                    )}
                  </div>

                  {/* Basic vitals trend — only when the patient has data */}
                  {insightHasVitals && (
                    <div className="caretaker-card caretaker-chart-card">
                      <div className="caretaker-card-title">
                        <div>
                          <h2>🫀 Vitals Trend</h2>
                          <p>Last 7 days</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={insightTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="heart_rate"
                            name="Heart Rate (BPM)"
                            stroke="#e05d7d"
                            strokeWidth={2}
                            connectNulls
                            dot={{ r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="blood_sugar"
                            name="Blood Sugar (mg/dL)"
                            stroke="#209364"
                            strokeWidth={2}
                            connectNulls
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Summary based on the patient's actual data */}
                  <div className="caretaker-card">
                    <div className="caretaker-card-title">
                      <div>
                        <h2>🧠 Summary</h2>
                        <p>Based on {insights.patient?.name}'s records</p>
                      </div>
                      <div className="ai-insights-icon">✨</div>
                    </div>
                    <div className="ai-insight-message">
                      <p>{insights.ai_summary}</p>
                      {insights.risk?.factors?.length > 0 && (
                        <div className="ai-insight-tip">
                          <strong>Watch:</strong>{" "}
                          {insights.risk.factors.join(" · ")}
                        </div>
                      )}
                      {insights.last_checkup && (
                        <div className="ai-insight-tip">
                          Last checkup: {insights.last_checkup}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
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
                {actionableAlerts.length === 0 ? (
                  <p style={{ color: "#9690a2", fontSize: "14px" }}>
                    No alerts at the moment
                  </p>
                ) : (
                  actionableAlerts.map((alert, idx) => (
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

      {showLogoutConfirm && (
        <div
          className="logout-confirm-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-confirm-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="caretaker-logout-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="caretaker-logout-confirm-title">Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="logout-confirm-actions">
              <button
                className="caretaker-outline-button"
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="caretaker-ai-button"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Caretaker;