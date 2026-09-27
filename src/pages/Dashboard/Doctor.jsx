import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import { getRecoveryStatus, interpretRecoveryMetrics, getAlertIcon, getAlertClass } from "../../utils/doctorMetrics";
import "./Doctor.css";
import DoctorSettings from "./DoctorSettings/DoctorSettings";
import ChatPanel from "./ChatPanel";
import Phase2Milestones from "./Phase2Milestones";
import Phase2Journal from "./Phase2Journal";
import Phase2MedicineChecker from "./Phase2MedicineChecker";

const menuItems = [
  { name: "Dashboard", icon: "🏠" },
  { name: "Patient List", icon: "👥" },
  { name: "Patient Recovery Status", icon: "📈" },
  { name: "Appointments", icon: "📅" },
  { name: "Health Records", icon: "📄" },
  { name: "Patient Messages", icon: "💬" },
  { name: "AI Analysis", icon: "🤖" },
  { name: "Alerts", icon: "🔔" },
  { name: "Recovery Milestones", icon: "🏁" },
  { name: "Patient Journals", icon: "📓" },
  { name: "Medicine Checker", icon: "⚗️" },
  { name: "Settings", icon: "⚙️" },
];

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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
};

const getInitials = (name = "Doctor") =>
  name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Doctor() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Dashboard");
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctorSummary, setDoctorSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientOverview, setSelectedPatientOverview] = useState(null);
  const [selectedPatientOverviewLoading, setSelectedPatientOverviewLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([
    { id: 1, role: "ai", text: "Hello! I can analyze your patient data and answer questions about recovery, medications, and treatment plans." },
  ]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const doctorId = Number(savedUser?.id || localStorage.getItem("userId") || 101);
    const baseDoctor = savedUser && savedUser.role === "doctor"
      ? savedUser
      : {
          id: doctorId,
          name: savedUser?.name || "Dr. Ravi Verma",
          role: "doctor",
          email: savedUser?.email || "ravi@healtrack.ai",
          specialization: savedUser?.specialization || "Cardiologist",
          experience: savedUser?.experience || "8 years",
        };

    setDoctor(baseDoctor);

    const loadData = async () => {
      try {
        const [patientResponse, alertResponse, summaryResponse] = await Promise.all([
          fetch(`${API_BASE}/api/doctor/${doctorId}/patients`),
          fetch(`${API_BASE}/api/doctor/${doctorId}/alerts`),
          fetch(`${API_BASE}/api/doctor/${doctorId}/summary`),
        ]);

        const patientData = patientResponse.ok ? (await patientResponse.json()).patients || [] : [];
        const alertData = alertResponse.ok ? (await alertResponse.json()).alerts || [] : [];
        const summaryData = summaryResponse.ok ? (await summaryResponse.json()) : null;

        setPatients(patientData);
        setAlerts(alertData);
        setDoctorSummary(summaryData);
        if (patientData[0]) {
          setSelectedPatient(patientData[0]);
        }
      } catch (error) {
        console.error("Failed to load doctor dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh dashboard data every 30 seconds to sync with patient-side appointment changes
    const refreshInterval = setInterval(loadData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!selectedPatient && patients[0]) {
      setSelectedPatient(patients[0]);
    }
  }, [patients, selectedPatient]);

  useEffect(() => {
    if (!selectedPatient) {
      setSelectedPatientOverview(null);
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const doctorId = Number(savedUser?.id || localStorage.getItem("userId") || doctor?.id || 101);

    const fetchPatientOverview = async () => {
      setSelectedPatientOverviewLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/doctor/${doctorId}/patients/${selectedPatient.id}/overview`);
        const data = response.ok ? await response.json() : null;
        setSelectedPatientOverview(data);
      } catch (error) {
        console.error("Failed to load patient overview:", error);
        setSelectedPatientOverview(null);
      } finally {
        setSelectedPatientOverviewLoading(false);
      }
    };

    fetchPatientOverview();
  }, [selectedPatient, doctor?.id]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const summaryRecords = doctorSummary?.healthRecords || [];

    const builtPatientResults = patients
      .filter((patient) =>
        (patient.name || "").toLowerCase().includes(query) ||
        (patient.email || "").toLowerCase().includes(query) ||
        (patient.recovery_type || patient.condition || "").toLowerCase().includes(query)
      )
      .map((patient) => ({
        id: `patient-${patient.id}`,
        type: "patient",
        patientId: patient.id,
        label: patient.name,
        details: `${patient.recovery_type || patient.condition || "General recovery"} • ${patient.recovery || 0}% recovery`,
      }));

    const builtRecordResults = summaryRecords
      .filter((record) => {
        const title = (record.title || "").toLowerCase();
        const patientName = (record.patientName || "").toLowerCase();
        const subtitle = (record.subtitle || "").toLowerCase();
        return title.includes(query) || patientName.includes(query) || subtitle.includes(query);
      })
      .map((record) => ({
        id: `record-${record.id}-${record.patientName || "patient"}`,
        type: "record",
        patientId: Number(record.id),
        label: record.patientName || "Patient record",
        details: record.title || "Health record",
      }));

    return [...builtPatientResults, ...builtRecordResults].slice(0, 6);
  }, [searchQuery, patients, doctorSummary]);

  const unreadAlerts = alerts.filter((alert) => !alert.read).length;

  const handleNotificationClick = () => {
    const unreadIds = alerts.filter((alert) => !alert.read).map((alert) => alert.id);
    setNotificationOpen((prev) => !prev);
    if (!notificationOpen && unreadIds.length) {
      setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
      Promise.all(
        unreadIds.map((id) =>
          fetch(`${API_BASE}/api/notifications/${id}/read`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          })
        )
      ).catch((error) => console.error("Failed to mark notifications as read:", error));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showLogoutConfirm]);

  const handleAppointmentStatusChange = async (appointmentId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setDoctorSummary((prev) => ({
          ...prev,
          appointments: prev.appointments.map((apt) =>
            Number(apt.id) === Number(appointmentId) ? { ...apt, status: newStatus } : apt
          ),
        }));
        setSelectedPatientOverview((prev) => ({
          ...prev,
          appointments: prev.appointments.map((apt) =>
            Number(apt.id) === Number(appointmentId) ? { ...apt, status: newStatus } : apt
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to update appointment status:", error);
    }
  };

  const handleAiChat = async () => {
    if (!aiChatInput.trim() || !doctor?.id) return;
    const prompt = aiChatInput.trim();
    setAiChatMessages((prev) => [...prev, { id: Date.now(), role: "user", text: prompt }]);
    setAiChatInput("");
    setAiChatLoading(true);

    try {
      // Use doctorId to get doctor-specific AI insights
      const response = await fetch(`${API_BASE}/api/chat/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: doctor.id, message: prompt }),
      });
      const data = await response.json();
      setAiChatMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: data.reply || "I couldn't generate a response right now." }]);
    } catch (error) {
      console.error("AI chat error:", error);
      setAiChatMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: "I'm unable to answer right now. Please try again in a moment." }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  const doctorName = doctor?.name || "Dr. Ravi Verma";
  const doctorInitials = getInitials(doctorName);
  const greeting = getGreeting();

  const overview = doctorSummary?.overview || {
    totalPatients: patients.length,
    todaysAppointments: 0,
    averageRecovery: 0,
    pendingReports: 0,
  };

  const metrics = doctorSummary?.metrics || {
    overall: 0,
    physicalRecovery: 0,
    medicationRecovery: 0,
    dailyActivity: 0,
    improvingPatients: 0,
    needMonitoring: 0,
    excellentRecovery: 0,
  };

  const recentPatients = doctorSummary?.patients?.slice(0, 3) || patients.slice(0, 3);
  const appointments = doctorSummary?.appointments || [];
  const healthRecords = doctorSummary?.healthRecords || [];

  const renderDashboard = () => {
    const pendingAlertsCount = alerts.filter((alert) => !alert.read).length;

    return (
    <div className="page-stack">
      <div className="welcome-section">
        <div>
          <h1>
            {greeting}, {doctorName} 👋
          </h1>
          <p>Here&apos;s your patient overview and today&apos;s healthcare summary.</p>
        </div>
        <button className="primary-button" onClick={() => setActiveView("Patient Recovery Status")}>
          📊 View Summary
        </button>
      </div>

      <div className="top-grid">
        <div className="profile-card">
          <div className="patient-avatar doctor-avatar">{doctorInitials}</div>
          <h2>{doctorName}</h2>
          <p className="patient-age">Doctor</p>
          <div className="profile-details">
            <div>
              <span>Doctor ID</span>
              <strong>{doctor?.id ? `DR${String(doctor.id).padStart(5, "0")}` : "Not Available"}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{doctor?.email || "Not Added"}</strong>
            </div>
            <div>
              <span>Specialization</span>
              <strong>{doctor?.specialization || "Not Added"}</strong>
            </div>
            <div>
              <span>Experience</span>
              <strong>{doctor?.experience || "Not Added"}</strong>
            </div>
            <div>
              <span>Patients</span>
              <strong>{overview.totalPatients}</strong>
            </div>
          </div>
          <button className="outline-button" onClick={() => navigate("/doctor-profile")}>
            👨‍⚕️ View Profile
          </button>
        </div>

        <div className="recovery-card">
          <div className="card-title">
            <div>
              <h2>💙 Patient Recovery Status</h2>
              <p>Overall recovery of your patients</p>
            </div>
            <span className="date-select">This Month ⌄</span>
          </div>
          <div className="recovery-content">
            <div className="progress-circle">
              <div>
                <strong>{metrics.overall}%</strong>
                <small>Recovery</small>
              </div>
            </div>
            <div className="recovery-info">
              <div className="progress-row">
                <span>Physical Recovery</span>
                <strong>{metrics.physicalRecovery}%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${metrics.physicalRecovery}%` }}></div>
              </div>

              <div className="progress-row">
                <span>Medication</span>
                <strong>{metrics.medicationRecovery}%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${metrics.medicationRecovery}%` }}></div>
              </div>

              <div className="progress-row">
                <span>Daily Activity</span>
                <strong>{metrics.dailyActivity}%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${metrics.dailyActivity}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-title">
          <div>
            <h2>📊 Today&apos;s Overview</h2>
            <p>Your practice summary for today</p>
          </div>
        </div>
        <div className="health-cards compact">
          <div className="health-card patients">
            <div className="health-icon">👥</div>
            <span>Total Patients</span>
            <h3>{overview.totalPatients}</h3>
            <label>✓ Active</label>
          </div>
          <div className="health-card appointments">
            <div className="health-icon">📅</div>
            <span>Today&apos;s Appointments</span>
            <h3>{overview.todaysAppointments}</h3>
            <label>✓ Scheduled</label>
          </div>
          <div className="health-card reports">
            <div className="health-icon">🔔</div>
            <span>Pending Alerts</span>
            <h3>{pendingAlertsCount}</h3>
            <label>⚠ Review</label>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-title">
          <div>
            <h2>👥 Recent Patients</h2>
            <p>Recently viewed patients</p>
          </div>
          <button
            className="outline-button"
            onClick={() => setActiveView("Patient List")}
            style={{ marginTop: 0, padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
          >
            View All →
          </button>
        </div>
        <div className="record-list">
          {recentPatients.length > 0 ? recentPatients.map((patient) => (
            <div className="record-item" key={patient.id} onClick={() => setSelectedPatient(patient)} style={{ cursor: "pointer" }}>
              <div className="record-icon">{getInitials(patient.name)}</div>
              <div>
                <strong>{patient.name}</strong>
                <p>{patient.condition || patient.recovery_type || "General"} • Recovery {patient.recovery || 0}%</p>
              </div>
              <span>→</span>
            </div>
          )) : (
            <p>No patients yet.</p>
          )}
        </div>
      </div>
    </div>
    );
  };

  const renderPatientList = () => (
    <div className="page-stack">
      <PageHeader icon="👥" title="Patient List" subtitle="Manage and monitor your patients" />
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

          {patients.map((patient) => (
            <div className="patient-row" key={patient.id} onClick={() => setSelectedPatient(patient)} style={{ cursor: "pointer" }}>
              <div className="patient-name">
                <div className="patient-table-avatar">{getInitials(patient.name)}</div>
                <strong>{patient.name}</strong>
              </div>
              <span>{patient.age}</span>
              <span>{patient.recovery_type || patient.condition || "General"}</span>
              <div className="table-progress">
                <strong>{patient.recovery || 0}%</strong>
                <div className="small-progress">
                  <div style={{ width: `${patient.recovery || 0}%` }}></div>
                </div>
              </div>
              <span className="status-badge">{patient.status || "Monitoring"}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedPatient && (
        <div className="dashboard-card" style={{ marginTop: 20 }}>
          <div className="card-title">
            <div>
              <h2>🩺 {selectedPatient.name}</h2>
              <p>{selectedPatient.recovery_type || "General recovery"} • Recovery {selectedPatient.recovery || 0}%</p>
            </div>
          </div>

          <div className="patient-detail-grid">
            <div className="mini-stat">
              <span>💚</span>
              <strong>{selectedPatientOverview?.recovery?.overall ?? selectedPatient.recovery ?? 0}%</strong>
              <small>Overall recovery</small>
            </div>
            <div className="mini-stat">
              <span>📅</span>
              <strong>{selectedPatientOverview?.appointments?.length ?? appointments.filter((a) => Number(a.user_id) === Number(selectedPatient.id)).length}</strong>
              <small>Appointments</small>
            </div>
            <div className="mini-stat">
              <span>⚠️</span>
              <strong>{selectedPatientOverview?.alerts?.length ?? alerts.filter((a) => Number(a.user_id) === Number(selectedPatient.id)).length}</strong>
              <small>Alerts</small>
            </div>
          </div>

          {selectedPatientOverviewLoading ? (
            <p>Loading live patient details...</p>
          ) : (
            <>
              <div className="content-grid three-col" style={{ marginTop: 20 }}>
                <div className="mini-stat">
                  <span>🏃</span>
                  <strong>{selectedPatientOverview?.recovery?.physicalRecovery ?? 0}%</strong>
                  <small>Physical Recovery</small>
                </div>
                <div className="mini-stat">
                  <span>💊</span>
                  <strong>{selectedPatientOverview?.recovery?.medicationRecovery ?? 0}%</strong>
                  <small>Medication Adherence</small>
                </div>
                <div className="mini-stat">
                  <span>📈</span>
                  <strong>{selectedPatientOverview?.recovery?.dailyActivity ?? 0}%</strong>
                  <small>Daily Activity</small>
                </div>
              </div>

              <div className="lower-grid" style={{ marginTop: 20 }}>
                <div className="dashboard-card">
                  <div className="card-title">
                    <div>
                      <h2>💊 Medications</h2>
                      <p>Live medicine schedule from the patient dashboard</p>
                    </div>
                  </div>
                  <div className="record-list">
                    {(selectedPatientOverview?.medicines || []).map((medicine) => (
                      <div className="medicine-item" key={medicine.id || `${medicine.name}-${medicine.schedule}`}>
                        <div className="medicine-icon">💊</div>
                        <div>
                          <strong>{medicine.name}</strong>
                          <p>{medicine.dosage || "Dose unspecified"} • {medicine.schedule || "Schedule pending"}</p>
                        </div>
                        <span className={medicine.status === "pending" ? "pending" : "taken"}>{medicine.status || "active"}</span>
                      </div>
                    )) || <p>No medicines recorded.</p>}
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-title">
                    <div>
                      <h2>📄 Health Records</h2>
                      <p>Latest health readings from the patient dashboard</p>
                    </div>
                  </div>
                  <div className="record-list">
                    {(selectedPatientOverview?.healthRecords || []).slice(0, 4).map((record) => (
                      <div className="record-item" key={record.id || `${record.recorded_at}-${record.type}`}>
                        <div className="record-icon">🩺</div>
                        <div>
                          <strong>{record.type || "Health Record"}</strong>
                          <p>{record.recorded_at ? new Date(record.recorded_at).toLocaleString() : "No timestamp"}</p>
                        </div>
                        <span>→</span>
                      </div>
                    )) || <p>No health records available.</p>}
                  </div>
                </div>
              </div>

              <div className="lower-grid" style={{ marginTop: 20 }}>
                <div className="dashboard-card">
                  <div className="card-title">
                    <div>
                      <h2>📅 Upcoming Appointments</h2>
                      <p>Patient scheduled visits and follow-ups</p>
                    </div>
                  </div>
                  <div className="appointment-list">
                    {(selectedPatientOverview?.appointments || []).map((appointment) => (
                      <div className="appointment large" key={appointment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 12, flex: 1 }}>
                          <div className="appointment-date">
                            <strong>{new Date(`${appointment.date}T00:00:00`).getDate()}</strong>
                            <span>{new Date(`${appointment.date}T00:00:00`).toLocaleString("en-US", { month: "short" }).toUpperCase()}</span>
                          </div>
                          <div>
                            <strong>{appointment.title}</strong>
                            <p>{appointment.type || "Appointment"}</p>
                            <small>{appointment.time || "Time TBD"} • {appointment.location || "Clinic"}</small>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className="appointment-status">{appointment.status || "Upcoming"}</span>
                          {(appointment.status === "pending" || appointment.status === "requested") && (
                            <>
                              <button 
                                className="primary-button"
                                onClick={() => handleAppointmentStatusChange(appointment.id, "scheduled")}
                                style={{ padding: "6px 12px", fontSize: "12px" }}
                              >
                                ✓ Confirm
                              </button>
                              <button 
                                className="outline-button"
                                onClick={() => handleAppointmentStatusChange(appointment.id, "cancelled")}
                                style={{ padding: "6px 12px", fontSize: "12px" }}
                              >
                                ✕ Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )) || <p>No appointments scheduled.</p>}
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-title">
                    <div>
                      <h2>🔔 Alerts</h2>
                      <p>Patient health and medication alerts</p>
                    </div>
                  </div>
                  <div className="alert-list">
                    {(selectedPatientOverview?.alerts || []).slice(0, 4).map((alert) => (
                      <div className={`alert-item ${alert.type === "warning" ? "warning" : alert.type === "success" ? "success" : "info"}`} key={alert.id}>
                        <span>{alert.type === "warning" ? "⚠️" : alert.type === "success" ? "💙" : "📅"}</span>
                        <div>
                          <strong>{alert.title}</strong>
                          <p>{alert.message}</p>
                        </div>
                      </div>
                    )) || <p>No patient alerts.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderRecoveryStatus = () => (
    <div className="page-stack">
      <PageHeader icon="📈" title="Patient Recovery Status" subtitle="Track your patients' recovery progress" />
      <div className="dashboard-card recovery-main-card">
        <div className="recovery-main">
          <div className="progress-circle large">
            <div>
              <strong>{metrics.overall}%</strong>
              <small>Overall</small>
            </div>
          </div>
          <div className="recovery-details">
            <h2>💙 Overall Patient Recovery</h2>
            <p>Your patients are showing steady recovery progress.</p>

            <div className="progress-item">
              <div className="progress-row">
                <span>Physical Recovery</span>
                <strong>{metrics.physicalRecovery}%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${metrics.physicalRecovery}%` }}></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-row">
                <span>Medication Adherence</span>
                <strong>{metrics.medicationRecovery}%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${metrics.medicationRecovery}%` }}></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-row">
                <span>Daily Activity</span>
                <strong>{metrics.dailyActivity}%</strong>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${metrics.dailyActivity}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid three-col">
        <div className="mini-stat">
          <span>💚</span>
          <strong>{metrics.improvingPatients}</strong>
          <small>Improving Patients</small>
        </div>
        <div className="mini-stat">
          <span>⚠️</span>
          <strong>{metrics.needMonitoring}</strong>
          <small>Need Monitoring</small>
        </div>
        <div className="mini-stat">
          <span>⭐</span>
          <strong>{metrics.excellentRecovery}</strong>
          <small>Excellent Recovery</small>
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="page-stack">
      <PageHeader icon="📅" title="Appointments" subtitle="Manage your upcoming patient appointments" />
      <div className="dashboard-card">
        <div className="appointment-list">
          {(appointments || []).map((appointment) => (
            <div className="appointment large" key={appointment.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12, flex: 1 }}>
                <div className="appointment-date">
                  <strong>{new Date(`${appointment.date}T00:00:00`).getDate()}</strong>
                  <span>{new Date(`${appointment.date}T00:00:00`).toLocaleString("en-US", { month: "short" }).toUpperCase()}</span>
                </div>
                <div>
                  <strong>{appointment.patientName || "Patient"}</strong>
                  <p>{appointment.title}</p>
                  <small>{appointment.time || "Time TBD"} • {appointment.location || "Selected clinic"}</small>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="appointment-status">{appointment.status || "Upcoming"}</span>
                {(appointment.status === "pending" || appointment.status === "requested") && (
                  <>
                    <button 
                      className="primary-button"
                      onClick={() => handleAppointmentStatusChange(appointment.id, "scheduled")}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      ✓ Confirm
                    </button>
                    <button 
                      className="outline-button"
                      onClick={() => handleAppointmentStatusChange(appointment.id, "cancelled")}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHealthRecords = () => (
    <div className="page-stack">
      <PageHeader icon="📄" title="Health Records" subtitle="Review patient medical reports and documents" />
      <div className="dashboard-card">
        <div className="record-list large-list">
          {(healthRecords || []).map((record) => (
            <div className="record-item" key={`${record.id}-${record.patientName}`}>
              <div className="record-icon">🩺</div>
              <div>
                <strong>{record.title}</strong>
                <p>{record.subtitle}</p>
              </div>
              <span>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAIAnalysis = () => (
    <div className="page-stack">
      <PageHeader icon="🤖" title="AI Analysis" subtitle="AI-powered patient insights and recommendations" />
      <div className="dashboard-card ai-main-card">
        <div className="ai-top">
          <div className="ai-icon big">✨</div>
          <div>
            <h2>🟢 Patient Health Analysis</h2>
            <p>AI analysis has identified important recovery trends among your patients.</p>
          </div>
        </div>

        <div className="ai-insights">
          <div>
            <strong>💙 Recovery</strong>
            <p>Most patients are showing positive recovery progress.</p>
          </div>
          <div>
            <strong>💊 Medication</strong>
            <p>Medication adherence is at {metrics.medicationRecovery}% across the assigned patient list.</p>
          </div>
          <div>
            <strong>💡 Recommendation</strong>
            <p>Review {Math.max(metrics.needMonitoring, 0)} patients requiring additional monitoring.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="primary-button" onClick={() => setActiveView("Dashboard")} style={{ marginTop: 0 }}>✨ View Full Analysis</button>
          <button className="outline-button" onClick={() => setAiChatOpen(!aiChatOpen)} style={{ marginTop: 0, width: "fit-content", padding: "11px 20px" }}>
            {aiChatOpen ? "Close Chat" : "Ask AI"}
          </button>
        </div>

        {aiChatOpen && (
          <div style={{ marginTop: 18, border: "1px solid #dfeceb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#eefaf9", padding: 12, borderBottom: "1px solid #dfeceb", fontWeight: 700 }}>AI Care Assistant</div>
            <div style={{ maxHeight: 260, overflowY: "auto", padding: 12, display: "grid", gap: 10 }}>
              {aiChatMessages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", background: msg.role === "user" ? "#0ca69e" : "#f3f7f7", color: msg.role === "user" ? "#fff" : "#1b4b50", padding: "10px 12px", borderRadius: 12, lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiChatLoading && <div style={{ color: "#5f7a7d", fontSize: 12 }}>AI is thinking...</div>}
            </div>
            <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #dfeceb" }}>
              <input value={aiChatInput} onChange={(e) => setAiChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAiChat()} placeholder="Ask about patient trends, recovery, medications..." style={{ flex: 1, border: "1px solid #d6e9e8", borderRadius: 8, padding: "10px 12px" }} />
              <button className="primary-button" onClick={handleAiChat} disabled={aiChatLoading} style={{ marginTop: 0 }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="page-stack">
      <PageHeader icon="🔔" title="Alerts" subtitle="Important patient reminders and updates" />
      <div className="dashboard-card">
        <div className="alert-list">
          {(alerts || []).map((alert) => (
            <div className={`alert-item ${alert.type === "warning" ? "warning" : alert.type === "success" ? "success" : "info"}`} key={alert.id}>
              <span>{alert.type === "warning" ? "⚠️" : alert.type === "success" ? "💙" : "📅"}</span>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <div className="page-stack"><PageHeader icon="⏳" title="Loading" subtitle="Preparing your physician dashboard..." /></div>;
    }

    switch (activeView) {
      case "Dashboard":
        return renderDashboard();
      case "Patient List":
        return renderPatientList();
      case "Patient Recovery Status":
        return renderRecoveryStatus();
      case "Appointments":
        return renderAppointments();
      case "Health Records":
        return renderHealthRecords();
      case "Patient Messages":
        return (
          <div className="page-stack">
            <PageHeader icon="💬" title="Patient Messages" subtitle="Chat with your connected patients" />
            <ChatPanel userId={Number(doctor?.id || localStorage.getItem("userId") || 101)} side="doctor" />
          </div>
        );
      case "AI Analysis":
        return renderAIAnalysis();
      case "Alerts":
        return renderAlerts();
      case "Recovery Milestones":
        return (
          <Phase2Milestones
            isDoctor
            doctorId={Number(doctor?.id || localStorage.getItem("userId") || 101)}
          />
        );
      case "Patient Journals":
        return (
          <Phase2Journal
            isDoctor
            doctorId={Number(doctor?.id || localStorage.getItem("userId") || 101)}
          />
        );
      case "Medicine Checker":
        return <Phase2MedicineChecker />;
      case "Settings":
        return <DoctorSettings />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="doctor-dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🩺</div>
          <div className="brand-text">
            <span>HealTrack AI</span>
            <small>Your Recovery, Our Support</small>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="menu-heading">MAIN MENU</div>
          <div className="sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className={`menu-item ${activeView === item.name ? "active" : ""}`}
                onClick={() => {
                  setActiveView(item.name);
                  setProfileMenuOpen(false);
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-button" onClick={() => setShowLogoutConfirm(true)}>
            <span className="menu-icon">⎋</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="search-box">
            <span>🔎</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setNotificationOpen(false)}
              placeholder="Search patients, records..."
            />
            {searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map((result) => {
                  const matchedPatient = patients.find((patient) => Number(patient.id) === Number(result.patientId));
                  return (
                    <button
                      key={result.id}
                      className="search-result"
                      onClick={() => {
                        const targetPatient = matchedPatient || patients.find((patient) => Number(patient.id) === Number(result.patientId));
                        if (targetPatient) {
                          setSelectedPatient(targetPatient);
                          setSearchQuery("");
                          if (result.type === "record") {
                            setActiveView("Health Records");
                          } else {
                            setActiveView("Patient List");
                          }
                        }
                      }}
                    >
                      <div className="search-result-main">
                        <strong>{result.label}</strong>
                        <small>{result.details}</small>
                      </div>
                      <span className="search-result-type">{result.type === "record" ? "Record" : "Patient"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="header-right">
            <button className="notification" onClick={handleNotificationClick} aria-label="Notifications">
              🔔
              {unreadAlerts > 0 && <span />}
            </button>
            {notificationOpen && (
              <div className="notification-dropdown">
                {alerts.length ? (
                  alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="notify-item">
                      <strong>{alert.title}</strong>
                      <p>{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="notify-item">
                    <strong>No notifications</strong>
                    <p>You're all caught up.</p>
                  </div>
                )}
              </div>
            )}

            <div className="patient-header">
              <div className="patient-small-avatar">{doctorInitials}</div>
              <div className="doctor-header-meta">
                <button className="doctor-name-button" onClick={() => setProfileMenuOpen((prev) => !prev)}>
                  {doctorName}
                </button>
                {profileMenuOpen && (
                  <div className="profile-menu">
                    <button onClick={() => navigate("/doctor-profile")}>View/Edit Profile</button>
                    <button onClick={() => { setProfileMenuOpen(false); setShowLogoutConfirm(true); }}>Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">{renderContent()}</main>
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
            aria-labelledby="logout-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="logout-confirm-title">Confirm Logout</h2>
            <p>Are you sure you want to log out of your account?</p>
            <div className="logout-confirm-actions">
              <button
                className="outline-button"
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
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

export default Doctor;
