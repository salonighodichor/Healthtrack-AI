import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./Patient.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

const menuItems = [
  { name: "Dashboard", icon: "🏠" },
  { name: "Health Overview", icon: "❤️" },
  { name: "Recovery", icon: "💚" },
  { name: "Health Records", icon: "📄" },
  { name: "AI Analysis", icon: "🤖" },
  { name: "Medicines", icon: "💊" },
  { name: "Appointments", icon: "📅" },
  { name: "Alerts", icon: "🔔" },
  { name: "Find a Doctor", icon: "👩‍⚕️" },
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

/* =====================================================
   HEALTH OVERVIEW
===================================================== */

const HealthOverview = () => {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    blood_sugar: "",
    heart_rate: "",
    systolic: "",
    diastolic: "",
    hemoglobin: "",
  });

  const userId = localStorage.getItem("userId");

  const loadReading = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/health-record/${userId}/latest`)
      .then((response) => response.json())
      .then((data) => {
        setReading(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching health record:", error);
        setLoading(false);
      });
  };

    useEffect(() => {
    loadReading();
  }, [userId]);

  const handleAddReading = () => {
    if (!userId) return;

    fetch(`${API_BASE}/api/health-record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        blood_sugar: formData.blood_sugar ? Number(formData.blood_sugar) : null,
        heart_rate: formData.heart_rate ? Number(formData.heart_rate) : null,
        systolic: formData.systolic ? Number(formData.systolic) : null,
        diastolic: formData.diastolic ? Number(formData.diastolic) : null,
        hemoglobin: formData.hemoglobin ? Number(formData.hemoglobin) : null,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        setFormData({
          blood_sugar: "",
          heart_rate: "",
          systolic: "",
          diastolic: "",
          hemoglobin: "",
        });
        setShowForm(false);
        loadReading();
      })
      .catch((error) => console.error("Error adding reading:", error));
  };

  const statusLabel = (status) => {
    if (status === "high") return "⚠️ High";
    if (status === "low") return "⚠️ Low";
    if (status === "normal") return "✓ Normal";
    return "— No data";
  };

  const statusClass = (status) => {
    if (status === "high" || status === "low") return "status-warning";
    if (status === "normal") return "status-ok";
    return "";
  };

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader
          icon="❤️"
          title="Health Overview"
          subtitle="Today's health measurements and wellness status"
        />
        <p>Loading health data...</p>
      </div>
    );
  }

  const hasData = reading?.has_data;

  return (
    <div className="page-stack">
      <PageHeader
        icon="❤️"
        title="Health Overview"
        subtitle="Today's health measurements and wellness status"
      />

      <button
        className="primary-button"
        onClick={() => setShowForm(!showForm)}
        style={{ width: "fit-content" }}
      >
        {showForm ? "✕ Cancel" : "+ Add Reading"}
      </button>

      {showForm && (
        <div className="dashboard-card">
          <div className="card-title">
            <div>
              <h2>📝 Add New Reading</h2>
              <p>Enter your current health measurements</p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label>Blood Sugar (mg/dL)</label>
              <input
                type="number"
                value={formData.blood_sugar}
                onChange={(e) =>
                  setFormData({ ...formData, blood_sugar: e.target.value })
                }
              />
            </div>

            <div>
              <label>Heart Rate (BPM)</label>
              <input
                type="number"
                value={formData.heart_rate}
                onChange={(e) =>
                  setFormData({ ...formData, heart_rate: e.target.value })
                }
              />
            </div>

            <div>
              <label>Blood Pressure - Systolic (mmHg)</label>
              <input
                type="number"
                value={formData.systolic}
                onChange={(e) =>
                  setFormData({ ...formData, systolic: e.target.value })
                }
              />
            </div>

            <div>
              <label>Blood Pressure - Diastolic (mmHg)</label>
              <input
                type="number"
                value={formData.diastolic}
                onChange={(e) =>
                  setFormData({ ...formData, diastolic: e.target.value })
                }
              />
            </div>

            <div>
              <label>Hemoglobin (g/dL)</label>
              <input
                type="number"
                value={formData.hemoglobin}
                onChange={(e) =>
                  setFormData({ ...formData, hemoglobin: e.target.value })
                }
              />
            </div>
          </div>

          <button
            className="primary-button"
            onClick={handleAddReading}
            style={{ marginTop: "16px" }}
          >
            ✓ Save Reading
          </button>
        </div>
      )}

      <div className="health-cards">
          <div className="health-card sugar">
          <div className="health-icon">🩸</div>
          <span>Blood Sugar</span>
          <h3>
            {hasData && reading.blood_sugar?.value != null
              ? reading.blood_sugar.value
              : "--"}{" "}
            <small>mg/dL</small>
          </h3>
          <label className={statusClass(reading?.blood_sugar?.status)}>
            {statusLabel(reading?.blood_sugar?.status)}
          </label>
        </div>

        <div className="health-card heart">
          <div className="health-icon">❤️</div>
          <span>Heart Rate</span>
          <h3>
            {hasData && reading.heart_rate?.value != null
              ? reading.heart_rate.value
              : "--"}{" "}
            <small>BPM</small>
          </h3>
          <label className={statusClass(reading?.heart_rate?.status)}>
            {statusLabel(reading?.heart_rate?.status)}
          </label>
        </div>

        <div className="health-card pressure">
          <div className="health-icon">💓</div>
          <span>Blood Pressure</span>
          <h3>
            {hasData && reading.blood_pressure?.systolic != null
              ? `${reading.blood_pressure.systolic} / ${reading.blood_pressure.diastolic}`
              : "--"}{" "}
            <small>mmHg</small>
          </h3>
          <label className={statusClass(reading?.blood_pressure?.status)}>
            {statusLabel(reading?.blood_pressure?.status)}
          </label>
        </div>

        <div className="health-card hemoglobin">
          <div className="health-icon">🩸</div>
          <span>Hemoglobin</span>
          <h3>
            {hasData && reading.hemoglobin?.value != null
              ? reading.hemoglobin.value
              : "--"}{" "}
            <small>g/dL</small>
          </h3>
          <label className={statusClass(reading?.hemoglobin?.status)}>
            {statusLabel(reading?.hemoglobin?.status)}
          </label>
        </div>
      </div>

      {!hasData && (
        <p style={{ color: "#888" }}>
        No health readings added yet.
        </p>
      )}

      <div className="content-grid two-col">
        <div className="dashboard-card">
          <div className="card-title">
            <div>
              <h2>📊 Health Summary</h2>
              <p>Quick view of your current health</p>
            </div>
          </div>

          <div className="summary-list">
            <div>
              <span>Overall Health</span>
              <strong className="status-good">
                {hasData ? "Good" : "No data"}
              </strong>
            </div>

            <div>
              <span>Heart Status</span>
              <strong>
                {reading?.heart_rate?.status === "normal"
                  ? "Stable"
                  : reading?.heart_rate?.status
                  ? "Needs attention"
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Recovery Status</span>
              <strong>78%</strong>
            </div>

            <div>
              <span>Last Checkup</span>
              <strong>{reading?.recorded_at || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-title">
            <div>
              <h2>💡 Health Tips</h2>
              <p>Simple daily reminders</p>
            </div>
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
};
/* =====================================================
   RECOVERY PROGRESS
===================================================== */

const RecoveryProgressCard = ({ patientData }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const loadProgress = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(
      `${API_BASE}/api/recovery-progress/${userId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch recovery progress");
        }

        return response.json();
      })
      .then((data) => {
        setProgress(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Error fetching recovery progress:",
          error
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProgress();

    const handleRecoveryUpdate = () => {
      loadProgress();
    };

    window.addEventListener(
      "recoveryUpdated",
      handleRecoveryUpdate
    );

    return () => {
      window.removeEventListener(
        "recoveryUpdated",
        handleRecoveryUpdate
      );
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="dashboard-card recovery-main-card">
        <div className="card-title">
          <div>
            <h2>💚 Recovery Progress</h2>
            <p>Your overall recovery status</p>
          </div>
        </div>

        <p>Loading recovery progress...</p>
      </div>
    );
  }

  const todayProgress = progress?.today || {};

  const overall =
    todayProgress.completion_percent ?? 0;

  const weeklyProgress =
    progress?.weekly_progress || [];

  const streak =
    progress?.current_streak ?? 0;

  return (
    <div className="dashboard-card recovery-main-card">

      <div className="card-title">
        <div>
          <h2>💚 Recovery Progress</h2>
          <p>Today's recovery progress</p>
        </div>
      </div>

      <div className="recovery-main">

        {/* Circular Progress */}

        <div
          className="progress-circle large"
          style={{
            "--progress": `${overall}%`,
          }}
        >
          <div className="progress-circle-inner">
            <strong>{overall}%</strong>
            <small>today</small>
          </div>
        </div>

        {/* Weekly Progress */}

        <div className="recovery-details">

          <div className="weekly-progress">

            <div className="weekly-title">
              <span>This week</span>

              <strong>
                {weeklyProgress.filter(
                  (day) => day.percent === 100
                ).length}
                /7 days
              </strong>
            </div>

            <div className="week-bars">

              {weeklyProgress.map((day) => (
                <div
                  key={day.date}
                  className="week-bar-item"
                  title={`${day.day}: ${day.percent}%`}
                >
                  <span
                    className={
                      day.percent > 0
                        ? "active"
                        : ""
                    }
                    style={{
                      height: `${Math.max(
                        day.percent,
                        8
                      )}%`,
                    }}
                  ></span>

                  <small>{day.day}</small>
                </div>
              ))}

            </div>

            <p>
              🔥 {streak} day
              {streak !== 1 ? "s" : ""} streak
            </p>

          </div>

        </div>

      </div>

      <p className="recovery-tip">
        📈 Keep it up
        {patientData?.name
          ? `, ${patientData.name}`
          : ""}!
        You're at {overall}% today.
      </p>

    </div>
  );
};

/* =====================================================
   HEALTH RECORDS
===================================================== */

const HealthRecords = ({ openModal }) => {
  const [recordsByType, setRecordsByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("Lab Report");
  const [uploadForm, setUploadForm] = useState({ title: "", file: null });

  const userId = localStorage.getItem("userId");

  const loadRecords = () => {
    if (!userId) {
      setLoading(false);
      setError("User not logged in.");
      return;
    }

    fetch(`${API_BASE}/api/records/${userId}/types`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch health records");
        return response.json();
      })
      .then((data) => {
        const categories = Array.isArray(data.categories) ? data.categories : [];
        setRecordsByType(categories);
        if (categories.length > 0) setSelectedType(categories[0].recordType);
        setError("");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching health records:", error);
        setError("Unable to load health records right now.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRecords();
  }, [userId]);

  const handleUpload = async () => {
    if (!userId || !selectedType || !uploadForm.title || !uploadForm.file) {
      setError("Please choose a record type, title, and document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = String(reader.result || "");
      setUploading(true);
      fetch(`${API_BASE}/api/documents/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordType: selectedType,
          title: uploadForm.title,
          fileName: uploadForm.file.name,
          mimeType: uploadForm.file.type || "application/octet-stream",
          fileSize: `${Math.max(1, Math.round(uploadForm.file.size / 1024))} KB`,
          fileData,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Upload failed");
          return response.json();
        })
        .then(() => {
          setUploadForm({ title: "", file: null });
          setError("");
          loadRecords();
          setUploading(false);
        })
        .catch((error) => {
          console.error("Upload error:", error);
          setError("Unable to upload document right now.");
          setUploading(false);
        });
    };
    reader.readAsDataURL(uploadForm.file);
  };

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader
          icon="📄"
          title="Health Records"
          subtitle="Your recent medical documents and reports"
        />
        <p>Loading health records...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        icon="📄"
        title="Health Records"
        subtitle="Your recent medical documents and reports"
      />

      <div className="dashboard-card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <div>
            <h2>📤 Upload a document</h2>
            <p>Add a PDF or image to your health record</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              <div style={{ fontSize: 11, marginBottom: 6 }}>Record type</div>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}>
                {recordsByType.length > 0 ? recordsByType.map((cat) => (
                  <option key={cat.recordType} value={cat.recordType}>{cat.recordType}</option>
                )) : <option value="Lab Report">Lab Report</option>}
              </select>
            </label>
            <label>
              <div style={{ fontSize: 11, marginBottom: 6 }}>Document title</div>
              <input value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} placeholder="CBC Report" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }} />
            </label>
          </div>
          <label>
            <div style={{ fontSize: 11, marginBottom: 6 }}>Choose file</div>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }} />
          </label>
          <button className="primary-button" onClick={handleUpload} disabled={uploading} style={{ width: "fit-content", marginTop: 0 }}>
            {uploading ? "Uploading..." : "Add Document"}
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="record-list large-list">
          {error ? (
            <p>{error}</p>
          ) : recordsByType.length === 0 ? (
            <p>No health records available.</p>
          ) : (
            recordsByType.map((category) => {
              const docs = Array.isArray(category.documents) ? category.documents : [];
              return (
                <div key={category.recordType} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <strong style={{ fontSize: 15 }}>{category.recordType}</strong>
                    <button className="primary-button" onClick={() => { setSelectedType(category.recordType); }} style={{ marginTop: 0, padding: "8px 12px" }}>Add Document</button>
                  </div>
                  {docs.length === 0 ? (
                    <p style={{ color: "#7d8f91" }}>No documents uploaded yet.</p>
                  ) : (
                    docs.map((record) => {
                      const title = record.title || "Medical Report";
                      const type = record.recordType || category.recordType || "Report";
                      const size = record.fileSize || record.file_size || "N/A";
                      const dateText = record.uploadedAt || record.created_at
                        ? new Date(record.uploadedAt || record.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        : "No date";
                      return (
                        <button className="record-item" key={record.id ?? title} onClick={() => openModal(`📄 ${title}`, `${type} • ${size}\n\nUploaded: ${dateText}`)}>
                          <div className="record-icon">🏥</div>
                          <div>
                            <strong>{title}</strong>
                            <p>{dateText} • {size}</p>
                          </div>
                          <span>→</span>
                        </button>
                      );
                    })
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   AI ANALYSIS
===================================================== */

const AIAnalysis = ({ openModal }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: "ai", text: "Hello! I can help with your recovery, medications, appointments, and vitals." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/ai-analysis/${userId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch AI analysis");
        return response.json();
      })
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching AI analysis:", error);
        setLoading(false);
      });
  }, [userId]);

  const sendChat = async () => {
    if (!userId || !chatInput.trim()) return;
    const prompt = chatInput.trim();
    setChatMessages((prev) => [...prev, { id: Date.now(), role: "user", text: prompt }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: prompt }),
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: data.reply || "I couldn't generate a response right now." }]);
    } catch (error) {
      console.error("AI chat error:", error);
      setChatMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: "I’m unable to answer right now. Please try again in a moment." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader
          icon="🤖"
          title="AI Analysis"
          subtitle="Personalized health insights and recommendations"
        />
        <p>Loading AI analysis...</p>
      </div>
    );
  }

  const status = analysis?.status || "Good";
  const healthScore = analysis?.health_score ?? 90;
  const summary = analysis?.summary || "Your recent health parameters are within the normal range.";
  const insight = analysis?.insight || "Your recovery is progressing well.";
  const recommendation = analysis?.recommendation || "Continue your recovery plan and regular checkups.";

  return (
    <div className="page-stack">
      <PageHeader
        icon="🤖"
        title="AI Analysis"
        subtitle="Personalized health insights and recommendations"
      />

      <div className="dashboard-card ai-main-card">
        <div className="ai-top">
          <div className="ai-icon big">✨</div>

          <div>
            <h2>{status === "Needs attention" ? "⚠️" : "🟢"} Health Status: {status}</h2>
            <p>{summary}</p>
          </div>
        </div>

        <div className="ai-insights">
          <div>
            <strong>📊 Health Score</strong>
            <p>{healthScore}% overall wellness score.</p>
          </div>

          <div>
            <strong>💚 Recovery</strong>
            <p>{insight}</p>
          </div>

          <div>
            <strong>💡 Recommendation</strong>
            <p>{recommendation}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="primary-button" onClick={() => openModal("🤖 AI Health Analysis", `Health Score: ${healthScore}%\n\n${summary}\n\n${insight}\n\n${recommendation}`)} style={{ marginTop: 0 }}>
            ✨ View Full Analysis
          </button>
          <button className="outline-button" onClick={() => setChatOpen(!chatOpen)} style={{ marginTop: 0, width: "fit-content", padding: "11px 20px" }}>
            {chatOpen ? "Close Chat" : "Ask AI"}
          </button>
        </div>

        {chatOpen && (
          <div style={{ marginTop: 18, border: "1px solid #dfeceb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#eefaf9", padding: 12, borderBottom: "1px solid #dfeceb", fontWeight: 700 }}>AI Care Assistant</div>
            <div style={{ maxHeight: 260, overflowY: "auto", padding: 12, display: "grid", gap: 10 }}>
              {chatMessages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", background: msg.role === "user" ? "#0ca69e" : "#f3f7f7", color: msg.role === "user" ? "#fff" : "#1b4b50", padding: "10px 12px", borderRadius: 12, lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && <div style={{ color: "#5f7a7d", fontSize: 12 }}>AI is thinking...</div>}
            </div>
            <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #dfeceb" }}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Ask about your health, medications, or recovery..." style={{ flex: 1, border: "1px solid #d6e9e8", borderRadius: 8, padding: "10px 12px" }} />
              <button className="primary-button" onClick={sendChat} disabled={chatLoading} style={{ marginTop: 0 }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =====================================================
   MEDICINES
===================================================== */

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ patientId: "", name: "", dosage: "", frequency: "Once daily", timing: "morning" });
  const [submitting, setSubmitting] = useState(false);
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  const loadMedicines = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/medicines/${userId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch medicines");
        return response.json();
      })
      .then((data) => {
        const list = Array.isArray(data.medicines) ? data.medicines : [];
        setMedicines(list);
        setError("");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching medicines:", error);
        setError("Unable to load medicines right now.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMedicines();
  }, [userId]);

  const updateStatus = (medicineId, nextStatus) => {
    fetch(`${API_BASE}/api/medicines/${medicineId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Failed to update medicine status");
        setError("");
        loadMedicines();
        window.dispatchEvent(new Event("alertsUpdated"));
        window.dispatchEvent(new Event("recoveryUpdated"));
        return payload;
      })
      .catch((error) => {
        console.error("Error updating medicine status:", error);
        setError(error.message || "Unable to update medicine status right now.");
      });
  };

  const handleDoctorAddMedicine = async () => {
    const patientId = Number(userRole === "doctor" ? doctorForm.patientId : userId);
    if (!patientId || !doctorForm.name || !doctorForm.dosage || !doctorForm.frequency || !doctorForm.timing) {
      setError("Please complete all medicine fields.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/medicines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: patientId,
          name: doctorForm.name,
          dosage: doctorForm.dosage,
          frequency: doctorForm.frequency,
          timing: doctorForm.timing,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to add medicine.");
      setDoctorForm({ patientId: "", name: "", dosage: "", frequency: "Once daily", timing: "morning" });
      setShowDoctorForm(false);
      setError("");
      loadMedicines();
      window.dispatchEvent(new Event("alertsUpdated"));
      window.dispatchEvent(new Event("recoveryUpdated"));
    } catch (error) {
      console.error("Error adding medicine:", error);
      setError(error.message || "Unable to add medicine.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader
          icon="💊"
          title="Medicines"
          subtitle="Today's medication schedule"
        />
        <p>Loading medicines...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        icon="💊"
        title="Medicines"
        subtitle="Today's medication schedule"
      />

      {userRole === "doctor" && (
        <div className="dashboard-card" style={{ marginBottom: 18 }}>
          <div className="card-title">
            <div>
              <h2>💉 Add Medicine</h2>
              <p>Add a prescription for a specific patient</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Patient ID</div>
                <input
                  type="number"
                  value={doctorForm.patientId}
                  onChange={(e) => setDoctorForm({ ...doctorForm, patientId: e.target.value })}
                  placeholder="1"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                />
              </label>

              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Medicine name</div>
                <input
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="Atorvastatin"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Dosage</div>
                <input
                  value={doctorForm.dosage}
                  onChange={(e) => setDoctorForm({ ...doctorForm, dosage: e.target.value })}
                  placeholder="10mg"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                />
              </label>

              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Frequency</div>
                <select
                  value={doctorForm.frequency}
                  onChange={(e) => setDoctorForm({ ...doctorForm, frequency: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                >
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                </select>
              </label>

              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Timing</div>
                <select
                  value={doctorForm.timing}
                  onChange={(e) => setDoctorForm({ ...doctorForm, timing: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                >
                  <option value="morning">Morning</option>
                  <option value="after breakfast">After breakfast</option>
                  <option value="after lunch">After lunch</option>
                  <option value="after dinner">After dinner</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </label>
            </div>

            <button className="primary-button" onClick={handleDoctorAddMedicine} disabled={submitting} style={{ width: "fit-content" }}>
              {submitting ? "Saving..." : "Add Medicine"}
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-card">
        <div className="medicine-list large-list">
          {error ? (
            <p>{error}</p>
          ) : medicines.length === 0 ? (
            <p>No medicines scheduled.</p>
          ) : (
            medicines.map((medicine) => {
              const normalized = String(medicine.status || "pending").toLowerCase();
              const isTaken = ["taken", "done", "completed", "complete"].includes(normalized);
              const isMissed = normalized === "missed";
              const isPending = !isTaken && !isMissed;

              return (
                <div className="medicine-item" key={medicine.id ?? medicine.name}>
                  <div className="medicine-icon">💊</div>

                  <div style={{ flex: 1 }}>
                    <strong>{medicine.name}</strong>
                    <small style={{ display: "block", marginTop: 4 }}>
                      {medicine.dosage} • {medicine.frequency} • {medicine.timing}
                    </small>
                  </div>

                  {userRole !== "doctor" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        className={isTaken ? "primary-button" : "outline-button"}
                        style={{ marginTop: 0, padding: "8px 12px" }}
                        onClick={() => updateStatus(medicine.id, "taken")}
                        disabled={isTaken}
                      >
                        Taken
                      </button>
                      <button
                        className={isPending ? "primary-button" : "outline-button"}
                        style={{ marginTop: 0, padding: "8px 12px" }}
                        onClick={() => updateStatus(medicine.id, "pending")}
                        disabled={isPending}
                      >
                        Pending
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   APPOINTMENTS
===================================================== */

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patientId: "",
    department: "Cardiology",
    doctorId: "101",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: "10:30 AM",
    reason: "",
    appointmentId: null,
  });

  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  const doctorOptions = [
    { id: 101, name: "Dr. Ravi Verma", department: "Cardiology", location: "City Care Hospital" },
    { id: 102, name: "Dr. Meera Shah", department: "Orthopedics", location: "Apollo Recovery Center" },
    { id: 103, name: "Dr. Aditi Nair", department: "Internal Medicine", location: "MediWell Hospital" },
  ];

  const timeSlots = ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM", "03:30 PM", "05:00 PM"];

  const loadAppointments = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/appointments/${userId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch appointments");
        return response.json();
      })
      .then((data) => {
        const list = Array.isArray(data.appointments) ? data.appointments : [];
        setAppointments(list);
        setError("");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setError("Unable to load appointments right now.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAppointments();
  }, [userId]);

  const normalizeStatus = (status) => {
    const value = String(status || "pending").toLowerCase();
    if (["scheduled", "upcoming"].includes(value)) return "Scheduled";
    if (value === "pending" || value === "requested") return "Pending";
    if (value === "cancelled") return "Cancelled";
    if (["completed", "done"].includes(value)) return "Completed";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const getStatusClass = (status) => {
    const value = String(status || "pending").toLowerCase();
    if (["upcoming", "scheduled", "pending", "requested"].includes(value)) return "appointment-status";
    if (value === "cancelled") return "appointment-status cancelled";
    return "appointment-status completed";
  };

  const updateStatus = async (appointmentId, nextStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Failed to update appointment");
      setError("");
      loadAppointments();
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch (error) {
      console.error("Error updating appointment:", error);
      setError(error.message || "Unable to update appointment right now.");
    }
  };

  const openRescheduleForm = (appointment) => {
    const foundDoctor = doctorOptions.find((doctor) => Number(doctor.id) === Number(appointment.doctorId)) || doctorOptions[0];
    setBookingForm({
      patientId: String(appointment.user_id || userId || ""),
      department: appointment.department || foundDoctor.department,
      doctorId: String(appointment.doctorId || foundDoctor.id),
      date: appointment.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time: appointment.time || "10:30 AM",
      reason: appointment.reason || "",
      appointmentId: appointment.id,
    });
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    const patientId = Number(userRole === "doctor" ? bookingForm.patientId : userId);

    if (!patientId || !bookingForm.department || !bookingForm.date || !bookingForm.time) {
      setError("Please complete the appointment details before saving.");
      return;
    }

    const selectedDoctor = doctorOptions.find((doctor) => Number(doctor.id) === Number(bookingForm.doctorId)) || doctorOptions[0];
    const requestBody = {
      user_id: patientId,
      title: bookingForm.reason ? `${selectedDoctor.department} consultation` : `${selectedDoctor.department} Follow-up`,
      type: selectedDoctor.department,
      department: selectedDoctor.department,
      doctorId: selectedDoctor.id,
      date: bookingForm.date,
      time: bookingForm.time,
      location: selectedDoctor.location,
      reason: bookingForm.reason,
      status: bookingForm.appointmentId ? undefined : "pending",
    };

    setIsSubmitting(true);
    try {
      const endpoint = bookingForm.appointmentId ? `${API_BASE}/api/appointments/${bookingForm.appointmentId}` : `${API_BASE}/api/appointments`;
      const method = bookingForm.appointmentId ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to save appointment.");
      setError("");
      setShowBookingForm(false);
      setBookingForm({
        patientId: "",
        department: "Cardiology",
        doctorId: "101",
        date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        time: "10:30 AM",
        reason: "",
        appointmentId: null,
      });
      loadAppointments();
      window.dispatchEvent(new Event("alertsUpdated"));
    } catch (error) {
      console.error("Error creating appointment:", error);
      setError(error.message || "Unable to save appointment right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader
          icon="📅"
          title="Appointments"
          subtitle="Your upcoming appointments"
        />
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        icon="📅"
        title="Appointments"
        subtitle="Your upcoming appointments"
      />

      <button className="primary-button" onClick={() => setShowBookingForm((prev) => !prev)} style={{ width: "fit-content" }}>
        {showBookingForm ? "Close Form" : "Book New Appointment"}
      </button>

      {showBookingForm && (
        <div className="dashboard-card" style={{ marginBottom: 18 }}>
          <div className="card-title">
            <div>
              <h2>🗓️ {bookingForm.appointmentId ? "Reschedule Appointment" : "Book Appointment"}</h2>
              <p>Choose a department, doctor, date, and time slot</p>
            </div>
          </div>

          <form onSubmit={handleBookingSubmit} style={{ display: "grid", gap: 12 }}>
            {userRole === "doctor" && (
              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Patient ID</div>
                <input
                  type="number"
                  value={bookingForm.patientId}
                  onChange={(event) => setBookingForm({ ...bookingForm, patientId: event.target.value })}
                  placeholder="Enter patient ID"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                />
              </label>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Department</div>
                <select
                  value={bookingForm.department}
                  onChange={(event) => {
                    const department = event.target.value;
                    const defaultDoctor = doctorOptions.find((doctor) => doctor.department === department) || doctorOptions[0];
                    setBookingForm({ ...bookingForm, department, doctorId: String(defaultDoctor.id) });
                  }}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                >
                  {Array.from(new Set(doctorOptions.map((doctor) => doctor.department))).map((department) => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </label>

              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Doctor</div>
                <select
                  value={bookingForm.doctorId}
                  onChange={(event) => setBookingForm({ ...bookingForm, doctorId: event.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                >
                  {doctorOptions.filter((doctor) => doctor.department === bookingForm.department).map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Date</div>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(event) => setBookingForm({ ...bookingForm, date: event.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                />
              </label>

              <label>
                <div style={{ fontSize: 11, marginBottom: 6 }}>Time slot</div>
                <select
                  value={bookingForm.time}
                  onChange={(event) => setBookingForm({ ...bookingForm, time: event.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <div style={{ fontSize: 11, marginBottom: 6 }}>Reason for visit (optional)</div>
              <input
                value={bookingForm.reason}
                onChange={(event) => setBookingForm({ ...bookingForm, reason: event.target.value })}
                placeholder="Follow-up consultation / recovery check"
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d7e8e7" }}
              />
            </label>

            <button className="primary-button" type="submit" disabled={isSubmitting} style={{ width: "fit-content" }}>
              {isSubmitting ? (bookingForm.appointmentId ? "Saving..." : "Booking...") : bookingForm.appointmentId ? "Save Changes" : "Confirm Booking"}
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-card">
        <div className="appointment-list">
          {error ? (
            <p>{error}</p>
          ) : appointments.length === 0 ? (
            <p>No appointments scheduled.</p>
          ) : (
            appointments.map((appointment) => {
              const dateObj = appointment.date ? new Date(appointment.date) : new Date();
              const statusValue = normalizeStatus(appointment.status);
              const statusClass = getStatusClass(appointment.status);
              const title = appointment.title || "Appointment";
              const subtitle = appointment.type || "Doctor appointment";
              const location = appointment.location || "Location not provided";
              const canConfirm = userRole === "doctor" && ["pending", "requested"].includes(String(appointment.status || "").toLowerCase());

              return (
                <div className="appointment large" key={appointment.id ?? title}>
                  <div className="appointment-date">
                    <strong>{dateObj.getDate()}</strong>
                    <span>{dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <strong>{title}</strong>
                    <p>{subtitle}</p>
                    <small>
                      {appointment.date ? new Date(appointment.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Date TBD"} • {appointment.time || "Time TBD"} • {location}
                    </small>
                    {appointment.reason && <p style={{ marginTop: 4, color: "#5b7173" }}>{appointment.reason}</p>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span className={statusClass}>{statusValue}</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {canConfirm && (
                        <button className="primary-button" style={{ marginTop: 0, padding: "8px 12px" }} onClick={() => updateStatus(appointment.id, "scheduled")}>
                          Confirm
                        </button>
                      )}
                      {appointment.status !== "cancelled" && (
                        <button className="outline-button" style={{ marginTop: 0, padding: "8px 12px" }} onClick={() => openRescheduleForm(appointment)}>
                          Reschedule
                        </button>
                      )}
                      {appointment.status !== "cancelled" && (
                        <button className="outline-button" style={{ marginTop: 0, padding: "8px 12px" }} onClick={() => updateStatus(appointment.id, "cancelled")}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   ALERTS
===================================================== */

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const loadAlerts = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/alerts/${userId}`)
      .then((response) => response.json())
      .then((data) => {
      setAlerts(Array.isArray(data) ? data : []);
        setLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching alerts:", error);
      setLoading(false);
    });
};

useEffect(() => {
  loadAlerts();
  const refreshAlerts = () => loadAlerts();
  window.addEventListener("alertsUpdated", refreshAlerts);
  return () => window.removeEventListener("alertsUpdated", refreshAlerts);
}, [userId]);

const markAsRead = async (alertId) => {
  if (!alertId) return;
  try {
    await fetch(`${API_BASE}/api/notifications/${alertId}/read`, { method: "PUT" });
    loadAlerts();
    window.dispatchEvent(new Event("alertsUpdated"));
  } catch (error) {
    console.error("Error marking alert as read:", error);
  }
};

const deleteAlert = async (alertId) => {
  if (!alertId) return;
  const deletedAlert = alerts.find((alert) => String(alert.id) === String(alertId));
  setAlerts((currentAlerts) => currentAlerts.filter((alert) => String(alert.id) !== String(alertId)));
  try {
    const response = await fetch(`${API_BASE}/api/notifications/${alertId}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || "Unable to delete alert");
    }
    window.dispatchEvent(new Event("alertsUpdated"));
  } catch (error) {
    console.error("Error deleting alert:", error);
    if (deletedAlert) {
      setAlerts((currentAlerts) => currentAlerts.some((alert) => String(alert.id) === String(alertId))
        ? currentAlerts
        : [deletedAlert, ...currentAlerts]);
    }
  }
};

const iconFor = (type) => {
  if (type === "warning") return "⚠️";
  if (type === "success") return "💚";
  return "📅";
};

if (loading) {
  return (
    <div className="page-stack">
      <PageHeader
        icon="🔔"
        title="Alerts"
        subtitle="Important health reminders and updates"
      />
      <p>Loading alerts...</p>
    </div>
  );
}

return (
  <div className="page-stack">
    <PageHeader
      icon="🔔"
      title="Alerts"
      subtitle="Important health reminders and updates"
    />

    <div className="dashboard-card">
      <div className="alert-list">
        {alerts.length === 0 ? (
          <p>No alerts right now.</p>
        ) : (
          alerts.map((alert) => (
            <div className={`alert-item ${alert.type} ${alert.read ? "read" : "unread"}`} key={alert.id} onClick={() => markAsRead(alert.id)} style={{ cursor: "pointer" }}>
              <span>{iconFor(alert.type)}</span>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
              {!alert.read && <span className="alert-dot" aria-label="Unread alert" />}
              <button type="button" className="alert-delete" aria-label={`Delete ${alert.title}`} onClick={(event) => { event.stopPropagation(); deleteAlert(alert.id); }}>×</button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);
};

/* =====================================================
   RECOVERY PLAN
===================================================== */

const RecoveryPlanCard = () => {
  const [currentDay, setCurrentDay] = useState(0);
  const [planData, setPlanData] = useState({});
  const [loading, setLoading] = useState(true);

  const [newTaskName, setNewTaskName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const minDay = -1;
  const maxDay = 1;

  const userId = localStorage.getItem("userId");


  /* ---------- Load Tasks ---------- */

  const loadTasks = () => {
  if (!userId) {
    setLoading(false);
    return;
  }

  fetch(`${API_BASE}/api/recovery-tasks/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch recovery tasks");
      }

      return response.json();
    })
    .then((responseData) => {
      const tasks = Array.isArray(responseData)
        ? responseData
        : responseData.tasks || [];

      const today = new Date();

      const todayDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const formatDate = (date) => {
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });
      };

      const getDayDifference = (taskDate) => {
        const d = new Date(taskDate);

        const taskDay = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate()
        );

        return Math.round(
          (taskDay - todayDate) /
            (1000 * 60 * 60 * 24)
        );
      };

      const formatLabel = (offset) => {
        const d = new Date(todayDate);

        d.setDate(d.getDate() + offset);

        const dateText = formatDate(d);

        if (offset === -1) {
          return `Yesterday, ${dateText}`;
        }

        if (offset === 0) {
          return `Today, ${dateText}`;
        }

        if (offset === 1) {
          return `Tomorrow, ${dateText}`;
        }

        return dateText;
      };

      const groupedTasks = {
        "-1": {
          label: formatLabel(-1),
          locked: true,
          tasks: [],
        },

        "0": {
          label: formatLabel(0),
          locked: false,
          tasks: [],
        },

        "1": {
          label: formatLabel(1),
          locked: true,
          future: true,
          tasks: [],
        },
      };

      /*
        Backend se aane wale tasks ko date ke
        according group kar rahe hain.
      */

      tasks.forEach((task) => {
        const difference = getDayDifference(
          task.date
        );

        if (
          difference >= -1 &&
          difference <= 1
        ) {
          groupedTasks[
            String(difference)
          ].tasks.push(task);
        }
      });

      /*
        Agar aaj ke tasks nahi hain lekin database me
        purane tasks hain, to unhe bhi current screen
        par dikhayenge.

        Isse existing tasks disappear nahi honge.
      */

      if (
        groupedTasks["0"].tasks.length === 0 &&
        tasks.length > 0
      ) {
        groupedTasks["0"].tasks = tasks;
      }

      setPlanData(groupedTasks);
      setLoading(false);
    })
    .catch((error) => {
      console.error(
        "Error fetching recovery tasks:",
        error
      );

      setLoading(false);
    });
};

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const data =
    planData[currentDay] || {
      label: "No recovery plan",
      tasks: [],
    };

  /* ---------- Change Day ---------- */

  const changeDay = (delta) => {
    const next = currentDay + delta;

    if (next < minDay || next > maxDay) {
      return;
    }

    setCurrentDay(next);
  };

  /* ---------- Toggle Task ---------- */

  const toggleTask = (taskId) => {
    if (currentDay !== 0) {
      return;
    }

    const currentTask = data.tasks.find(
      (task) => task.id === taskId
    );

    if (!currentTask) {
      return;
    }

    const newStatus =
      currentTask.status === "done"
        ? "pending"
        : "done";

    fetch(
      `${API_BASE}/api/recovery-tasks/${taskId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status: newStatus,

          meta:
            newStatus === "done"
              ? "Completed at " +
                new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Marked pending again",
        }),
      }
    )
      .then(() => {
  loadTasks();
  window.dispatchEvent(new Event("dailyActivityUpdated"));
})
.catch((error) =>
  console.error(
    "Error updating recovery task:",
    error
  )
);
  };

  /* ---------- Add Task ---------- */

  const addTask = () => {
    if (!newTaskName.trim() || !userId) {
      return;
    }

    const todayStr = new Date()
      .toISOString()
      .split("T")[0];

    fetch(
      `${API_BASE}/api/recovery-tasks`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          user_id: userId,
          date: todayStr,
          name: newTaskName,
          tag: "Check-in",
          status: "pending",
          meta: "Added manually",
        }),
      }
    )
      .then(() => {
        setNewTaskName("");
        loadTasks();
      })
      .catch((error) =>
        console.error("Error adding task:", error)
      );
  };

  /* ---------- Edit Task ---------- */

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.name);
  };

  const saveEdit = (taskId) => {
    if (!editText.trim()) {
      return;
    }

    fetch(
      `${API_BASE}/api/recovery-tasks/${taskId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: editText,
        }),
      }
    )
      .then(() => {
        setEditingId(null);
        loadTasks();
      })
      .catch((error) =>
        console.error(
          "Error editing task:",
          error
        )
      );
  };

  /* ---------- Delete Task ---------- */

  const deleteTask = (taskId) => {
    fetch(
      `${API_BASE}/api/recovery-tasks/${taskId}`,
      {
        method: "DELETE",
      }
    )
      .then(() => loadTasks())
      .catch((error) =>
        console.error(
          "Error deleting task:",
          error
        )
      );
  };

  /* ---------- Done Count ---------- */

  const doneCount = data.tasks.filter(
    (task) => task.status === "done"
  ).length;

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="dashboard-card">
        <p>Loading recovery plan...</p>
      </div>
    );
  }

  /* ---------- UI ---------- */

  return (
    <div className="dashboard-card recovery-plan-card">

      {/* Header */}

      <div className="card-title">
        <div>
          <h2>📝 Recovery Plan</h2>
          <p>Mark tasks as you complete them</p>
        </div>
      </div>

      {/* Date Navigation */}

      <div className="date-switch">

        <button
          disabled={currentDay <= minDay}
          onClick={() => changeDay(-1)}
        >
          ◀
        </button>

        <strong>{data.label}</strong>

        <button
          disabled={currentDay >= maxDay}
          onClick={() => changeDay(1)}
        >
          ▶
        </button>

      </div>

      {/* Task Summary */}

      <p className="day-summary">
        {data.future
          ? `${data.tasks.length} tasks scheduled — not due yet`
          : `${doneCount} of ${data.tasks.length} tasks done so far — mark them as you go`}
      </p>

      {/* Task List */}

      <div className="recovery-plan-grid">

        {data.tasks.length === 0 ? (
          <p>No recovery tasks available for this day.</p>
        ) : (
          data.tasks.map((task) => (

            <div
              key={task.id}
              className={`plan-item ${
                task.status === "done"
                  ? "completed"
                  : ""
              }`}
            >

              {/* Checkbox */}

              <div
                className="plan-check"
                onClick={() => toggleTask(task.id)}
                style={{
                  cursor:
                    currentDay === 0
                      ? "pointer"
                      : "default",
                }}
              >
                {task.status === "done"
                  ? "✓"
                  : "○"}
              </div>

              {/* Task Content */}

              <div style={{ flex: 1 }}>

                {editingId === task.id ? (

                  <input
                    value={editText}
                    onChange={(e) =>
                      setEditText(e.target.value)
                    }
                    autoFocus
                  />

                ) : (

                  <>
                    <strong>{task.name}</strong>
                    <p>{task.meta}</p>
                  </>

                )}

              </div>

              {/* Status Badge */}

              {currentDay !== 0 && (
                <span
                  className={`status-badge status-${task.status}`}
                >
                  {task.status === "done"
                    ? "Done"
                    : task.status === "missed"
                    ? "Missed"
                    : "Pending"}
                </span>
              )}

              {/* Edit / Delete */}

              {currentDay === 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                  }}
                >

                  {editingId === task.id ? (

                    <button
                      onClick={() =>
                        saveEdit(task.id)
                      }
                    >
                      💾
                    </button>

                  ) : (

                    <button
                      onClick={() =>
                        startEdit(task)
                      }
                    >
                      ✏️
                    </button>

                  )}

                  <button
                    onClick={() =>
                      deleteTask(task.id)
                    }
                  >
                    🗑️
                  </button>

                </div>
              )}

            </div>

          ))
        )}

      </div>

      {/* Add Task */}

      {currentDay === 0 && (
        <div
          className="add-task-row"
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
          }}
        >

          <input
            placeholder="Naya task likho..."
            value={newTaskName}
            onChange={(e) =>
              setNewTaskName(e.target.value)
            }
            style={{ flex: 1 }}
          />

          <button onClick={addTask}>
            + Add task
          </button>

        </div>
      )}

    </div>
  );
};

/* =====================================================
   DAILY ACTIVITY
===================================================== */

const DailyActivityCard = () => {
  const [activities, setActivities] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const loadActivities = () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(
      `${API_BASE}/api/daily-activities/${userId}`
    )
      .then((response) => response.json())
      .then((data) => {
        setActivities(data.activities || []);
        setPercentage(data.percentage || 0);
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Error fetching daily activities:",
          error
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const toggleActivity = (activity) => {
    const newStatus =
      activity.status === "done"
        ? "pending"
        : "done";

    fetch(
      `${API_BASE}/api/daily-activities/${activity.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    )
      .then(() => {
        loadActivities();

        window.dispatchEvent(
          new Event("recoveryUpdated")
        );
      })
      .catch((error) =>
        console.error(
          "Error updating activity:",
          error
        )
      );
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <p>Loading daily activity...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card daily-activity-card">

      <div className="card-title">
        <div>
          <h2>🏃 Daily Activity</h2>
          <p>Complete your daily recovery activities</p>
        </div>

        <strong>{percentage}%</strong>
      </div>

      <div className="activity-progress">
        <div
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p className="activity-summary">
        {activities.filter(
          (activity) => activity.status === "done"
        ).length}
        {" of "}
        {activities.length} activities completed
      </p>

      <div className="daily-activity-list">

        {activities.map((activity) => (

          <div
            key={activity.id}
            className={`activity-item ${
              activity.status === "done"
                ? "completed"
                : ""
            }`}
          >

            <button
              className="activity-check"
              onClick={() =>
                toggleActivity(activity)
              }
            >
              {activity.status === "done"
                ? "✓"
                : "○"}
            </button>

            <div>
              <strong>{activity.name}</strong>

              <p>
                ⏱️ {activity.duration} minutes
              </p>
            </div>

            <span>
              {activity.status === "done"
                ? "Completed"
                : "Pending"}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
};
/* =====================================================
   RECOVERY PHOTOS
===================================================== */

const RecoveryPhotosCard = () => {
  const [photos, setPhotos] = useState([]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (ev) => {
      const today = new Date().toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
        }
      );

      setPhotos((prev) => [
        ...prev,
        {
          url: ev.target.result,
          date: today,
        },
      ]);
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  return (
    <div className="dashboard-card">

      <div className="card-title">

        <div>
          <h2>📷 Recovery Photos</h2>

          <p>
            Upload a photo to track healing or log any
            reaction/side-effect
          </p>
        </div>

      </div>

      <div className="photo-grid">

        {photos.map((photo, index) => (
          <div
            key={index}
            className="photo-thumb-wrap"
          >

            <img
              className="photo-thumb"
              src={photo.url}
              alt="recovery"
            />

            <div className="photo-date">
              {photo.date}
            </div>

          </div>
        ))}

        <label className="upload-box">

          <span style={{ fontSize: "20px" }}>
            ＋
          </span>

          <span>Add Photo</span>

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          />

        </label>

      </div>

    </div>
  );
};

/* =====================================================
   RECOVERY HUB
===================================================== */

const RecoveryHub = ({ patientData }) => (
  <div className="page-stack">

    <PageHeader
      icon="💚"
      title="Recovery"
      subtitle="Track your progress and follow today's recovery plan"
    />

    <div className="content-grid two-col recovery-hub-grid">

      <RecoveryProgressCard
        patientData={patientData}
      />

      <RecoveryPlanCard />

    </div>

    <RecoveryPhotosCard />

  </div>
);

/* =====================================================
   DOCTOR CONNECTION CARD
===================================================== */
const DoctorConnectionCard = ({ patientData }) => {
 const [doctors, setDoctors] = useState([]);
 const [query, setQuery] = useState("");
 const [status, setStatus] = useState("");
 const [connectingId, setConnectingId] = useState(null);
 const [connectedDoctorId, setConnectedDoctorId] = useState(patientData?.assignedDoctor?.id || null);

 useEffect(() => {
   fetch(`${API_BASE}/api/doctors`)
     .then((response) => response.json())
     .then((data) => setDoctors(data.doctors || []))
     .catch((error) => console.error("Error fetching doctors:", error));
 }, []);

 const filteredDoctors = doctors.filter((doctor) => {
   const search = query.trim().toLowerCase();
   if (!search) return true;
   return (
     doctor.name.toLowerCase().includes(search) ||
     doctor.specialization.toLowerCase().includes(search) ||
     doctor.hospitalClinic.toLowerCase().includes(search)
   );
 });

 const handleConnect = (doctorId) => {
   if (!patientData?.id) return;

   setConnectingId(doctorId);
   setStatus("");

   fetch(`${API_BASE}/api/patient/${patientData.id}/connect-doctor`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ doctorId }),
   })
     .then((response) => response.json())
     .then((data) => {
       setStatus(data.message || "Connected successfully");
       setConnectedDoctorId(doctorId);
       window.dispatchEvent(new Event("patientDataUpdated"));
     })
     .catch((error) => {
       console.error("Error connecting doctor:", error);
       setStatus("Unable to connect right now. Please try again.");
     })
     .finally(() => setConnectingId(null));
 };

 return (
   <div className="dashboard-card doctor-connect-card">
     <div className="card-title">
       <div>
         <h2>👩‍⚕️ Find Your Doctor</h2>
         <p>Search and connect with a healthcare specialist</p>
       </div>
     </div>

     <div className="doctor-search-box">
       <span>🔍</span>
       <input
         type="text"
         value={query}
         onChange={(event) => setQuery(event.target.value)}
         placeholder="Search doctor, speciality or hospital"
       />
     </div>

     {status && <div className="doctor-connect-status">{status}</div>}

     <div className="doctor-list">
       {filteredDoctors.length === 0 ? (
         <p className="doctor-empty">No doctors match your search.</p>
       ) : (
         filteredDoctors.map((doctor) => (
           <div className="doctor-row" key={doctor.id}>
             <div className="doctor-row-meta">
               <div className="doctor-avatar-mini">DR</div>
               <div>
                 <strong>{doctor.name}</strong>
                 <p>{doctor.specialization}</p>
                 <small>{doctor.hospitalClinic}</small>
                 {doctor.rating && (
                   <div style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
                     ⭐ {doctor.rating.toFixed(1)} ({doctor.recoveryScore || 0}% recovery)
                   </div>
                 )}
               </div>
             </div>

             <button
               className="primary-button doctor-connect-btn"
               disabled={connectingId === doctor.id}
               onClick={() => handleConnect(doctor.id)}
             >
               {connectingId === doctor.id ? "Connecting..." : Number(connectedDoctorId) === Number(doctor.id) ? "Connected" : "Connect"}
             </button>
           </div>
         ))
       )}
     </div>
   </div>
 );
};

const NotificationToast = ({ onOpenAlerts }) => {
  const [toast, setToast] = useState(null);
  const knownIds = useRef(new Set());
  const initialized = useRef(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return undefined;

    const loadNotifications = async () => {
      const [alertsResponse, settingsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/alerts/${userId}`),
        fetch(`${API_BASE}/api/patient/${userId}/settings`),
      ]);
      if (!alertsResponse.ok || !settingsResponse.ok) return;
      const alerts = await alertsResponse.json();
      const settings = await settingsResponse.json();
      const items = Array.isArray(alerts) ? alerts : [];
      const appEnabled = settings.notifications?.enabled !== false && settings.notifications?.appNotifications !== false;
      const unread = items.filter((alert) => !alert.read);
      const newUnread = unread.filter((alert) => !knownIds.current.has(String(alert.id)));

      if (appEnabled && ((initialized.current && newUnread.length > 0) || (!initialized.current && unread.length > 0))) {
        setToast((initialized.current ? newUnread[0] : unread[0]) || null);
      }

      items.forEach((alert) => knownIds.current.add(String(alert.id)));
      initialized.current = true;
    };

    loadNotifications().catch((error) => console.error("Error loading notification toast:", error));
    const refresh = () => loadNotifications().catch((error) => console.error("Error refreshing notification toast:", error));
    window.addEventListener("alertsUpdated", refresh);
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("alertsUpdated", refresh);
      window.clearInterval(interval);
    };
  }, [userId]);

  if (!toast) return null;

  return (
    <div className="notification-toast" role="status">
      <button type="button" onClick={() => { setToast(null); onOpenAlerts(); }}>
        <strong>{toast.title}</strong>
        <span>{toast.message}</span>
      </button>
      <button type="button" className="notification-toast-close" aria-label="Dismiss notification" onClick={() => setToast(null)}>×</button>
    </div>
  );
};

/* =====================================================
   DASHBOARD HOME
===================================================== */
const DashboardHome = ({
 openModal,
 patientData,
}) => {
  const navigate = useNavigate();
  
  const getProgressColor = (percent) => {
    if (percent < 40) return "#e05252";   // laal - kam recovery
    if (percent < 70) return "#c79227";   // orange/yellow - medium
    return "#0ca69e";                     // green - achi recovery
  };

  const [progressRange, setProgressRange] = useState("month");
  const [dashboardProgress, setDashboardProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [dailyActivityPercentage, setDailyActivityPercentage] =
    useState(0);

  const [dailyActivityCompleted, setDailyActivityCompleted] =
    useState(0);

  const [dailyActivityTotal, setDailyActivityTotal] =
    useState(0);

  const userId = localStorage.getItem("userId");

  /* ================= DAILY ACTIVITY ================= */

  const loadDashboardActivity = () => {
    if (!userId) return;

    fetch(
      `${API_BASE}/api/daily-activities/${userId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch daily activity");
        }

        return response.json();
      })
      .then((data) => {
        setDailyActivityPercentage(data.percentage || 0);
        setDailyActivityCompleted(data.completed || 0);
        setDailyActivityTotal(data.total || 0);
      })
      .catch((error) => {
        console.error(
          "Error fetching dashboard daily activity:",
          error
        );
      });
  };

  useEffect(() => {
    loadDashboardActivity();

    const handleActivityUpdate = () => {
      loadDashboardActivity();
    };

    window.addEventListener(
      "dailyActivityUpdated",
      handleActivityUpdate
    );

    return () => {
      window.removeEventListener(
        "dailyActivityUpdated",
        handleActivityUpdate
      );
    };
  }, [userId]);

  /* ================= DASHBOARD PROGRESS ================= */

  useEffect(() => {
    if (!userId) {
      setLoadingProgress(false);
      return;
    }

    setLoadingProgress(true);

    fetch(
      `${API_BASE}/api/dashboard-progress/${userId}?range=${progressRange}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to fetch dashboard progress"
          );
        }

        return response.json();
      })
      .then((data) => {
        setDashboardProgress(data);
        setLoadingProgress(false);
      })
      .catch((error) => {
        console.error(
          "Error fetching dashboard progress:",
          error
        );

        setLoadingProgress(false);
      });
  }, [userId, progressRange]);

  /* ================= PATIENT ================= */

  if (!patientData) {
    return <p>Loading patient data...</p>;
  }

  const initials = patientData.name
    ? patientData.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";

  const calculateBMI = (heightCm, weightKg) => {
    if (!heightCm || !weightKg) {
      return "N/A";
    }

    const heightM = heightCm / 100;

    return (
      weightKg /
      (heightM * heightM)
    ).toFixed(1);
  };

  const bmi = calculateBMI(
    patientData.height,
    patientData.weight
  );

  /* ================= DASHBOARD ================= */

  return (
    <div className="page-stack">

      {/* WELCOME */}

      <div className="welcome-section">
        <div>
          <h1>
            {getGreeting()}, {patientData.name} 👋
          </h1>

          <p>
            Here's your health summary and recovery
            progress.
          </p>
        </div>
      </div>



      {/* TOP GRID */}

      <div className="top-grid">

        {/* PROFILE CARD */}

        <div className="profile-card">

          <div className="patient-avatar">
            {initials}
          </div>

          <h2>{patientData.name}</h2>

          <p className="patient-age">
            Patient Profile
          </p>

          <div className="profile-details">

            <div>
              <span>Patient ID</span>
              <strong>{patientData.id}</strong>
            </div>

            <div>
              <span>Blood Group</span>
              <strong>
                {patientData.blood_group}
              </strong>
            </div>

            <div>
              <span>BMI</span>
              <strong>{bmi}</strong>
            </div>

            <div>
              <span>Height</span>
              <strong>
                {patientData.height} cm
              </strong>
            </div>

            <div>
              <span>Weight</span>
              <strong>
                {patientData.weight} kg
              </strong>
            </div>

          </div>

          <button
            className="outline-button"
            onClick={() =>
              navigate(
                `/patient/details/${patientData.id}`
              )
            }
          >
            👤 View Profile
          </button>

        </div>


        {/* RECOVERY PROGRESS */}

        <div className="recovery-card">

          <div className="card-title">

            <div>
              <h2>💚 Recovery Progress</h2>
              <p>Your overall recovery status</p>
            </div>

            <select
              className="date-select"
              value={progressRange}
              onChange={(e) =>
                setProgressRange(e.target.value)
              }
            >
              <option value="week">
                This Week
              </option>

              <option value="month">
                This Month
              </option>

              <option value="last-week">
                Last Week
              </option>

              <option value="last-month">
                Last Month
              </option>
            </select>

          </div>


          {loadingProgress ? (

            <p>Loading recovery progress...</p>

          ) : (

            <div className="recovery-content">

              {/* OVERALL */}

              <div
            className="progress-circle"
            style={{
              "--progress": `${
                 dashboardProgress?.overall || 0
              }%`,
              "--progress-color": getProgressColor(
                dashboardProgress?.overall || 0
              ),
            }}
           >

                <div>
                  <strong>
                    {dashboardProgress?.overall || 0}%
                  </strong>

                  <small>
                    Recovered
                  </small>
                </div>

              </div>


              {/* DETAILS */}

              <div className="recovery-info">

                {/* PHYSICAL RECOVERY */}

                <div className="progress-row">

                  <span>
                    Physical Recovery
                  </span>

                  <strong>
                    {dashboardProgress?.physical_recovery || 0}%
                  </strong>

                </div>

                <div className="progress-bar">

                  <div
                    style={{
                      width: `${
                        dashboardProgress?.physical_recovery || 0
                      }%`,
                    }}
                  />

                </div>


                {/* MEDICATION */}

                <div className="progress-row">

                  <span>
                    Medication
                  </span>

                  <strong>
                    {dashboardProgress?.medication || 0}%
                  </strong>

                </div>

                <div className="progress-bar">

                  <div
                    style={{
                      width: `${
                        dashboardProgress?.medication || 0
                      }%`,
                    }}
                  />

                </div>


                {/* DAILY ACTIVITY */}

                <div className="progress-row">

                  <span>
                    Daily Activity
                  </span>

                  <strong>
                    {dailyActivityPercentage}%
                  </strong>

                </div>

                <div className="progress-bar">

                  <div
                    style={{
                      width: `${dailyActivityPercentage}%`,
                    }}
                  />

                </div>

                <small>
                  {dailyActivityCompleted} of{" "}
                  {dailyActivityTotal} activities completed
                </small>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* DAILY ACTIVITY */}

      <DailyActivityCard />


      {/* HEALTH OVERVIEW */}

      <div className="dashboard-card">

        <div className="card-title">

          <div>
            <h2>❤️ Health Overview</h2>
            <p>Today's health measurements</p>
          </div>

        </div>

        <div className="health-cards compact">

          <div className="health-card sugar">

            <div className="health-icon">
              🩸
            </div>

            <span>Blood Sugar</span>

            <h3>
              80 <small>mg/dL</small>
            </h3>

            <label>✓ Normal</label>

          </div>



          <div className="health-card heart">

            <div className="health-icon">
              ❤️
            </div>

            <span>Heart Rate</span>

            <h3>
              98 <small>BPM</small>
            </h3>

            <label>✓ Normal</label>

          </div>



          <div className="health-card pressure">

            <div className="health-icon">
              💓
            </div>

            <span>Blood Pressure</span>

            <h3>
              90 <small>/ 72 mmHg</small>
            </h3>

            <label>✓ Normal</label>

          </div>



          <div className="health-card hemoglobin">

            <div className="health-icon">
              🩸
            </div>

            <span>Hemoglobin</span>

            <h3>
              14 <small>g/dL</small>
            </h3>

            <label>✓ Normal</label>

          </div>

        </div>

        <DoctorConnectionCard patientData={patientData} />

      </div>

    </div>
  );
};
/* =====================================================
   MAIN PATIENT COMPONENT
===================================================== */

const Patient = () => {

  const navigate = useNavigate();

  const [patientData, setPatientData] =
    useState(null);

  useEffect(() => {

    const userId =
      localStorage.getItem("userId");

    if (!userId) {
      return;
    }

    
      fetch(
      `${API_BASE}/api/patient/${userId}`
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {
        setPatientData(data);
      })
      .catch((error) => {
        console.error(
          "Error fetching patient:",
          error
        );
      });

    fetch(`${API_BASE}/api/check-reminders/${userId}`).catch(
      (error) => console.error("Error checking reminders:", error)
    );

  }, []);

    const [activeMenu, setActiveMenu] =
    useState("Dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [alertCount, setAlertCount] = useState(0);

    const searchMatches = menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    useEffect(() => {
      const userId = localStorage.getItem("userId");

      if (!userId) return;

      const refreshAlertCount = () => {
        fetch(`${API_BASE}/api/alerts/${userId}`)
          .then((response) => response.json())
          .then((data) => setAlertCount(Array.isArray(data) ? data.filter((alert) => !alert.read).length : 0))
          .catch((error) => console.error("Error fetching alert count:", error));
      };

      refreshAlertCount();
      window.addEventListener("alertsUpdated", refreshAlertCount);
      return () => window.removeEventListener("alertsUpdated", refreshAlertCount);
    }, [activeMenu]);

    const [modal, setModal] =
      useState(null);

    const [darkMode, setDarkMode] = useState(() => {
      const storedTheme = localStorage.getItem("healtrack-theme");
      return storedTheme === "dark";
    });

    useEffect(() => {
      document.body.classList.toggle("dark-mode", darkMode);
      localStorage.setItem("healtrack-theme", darkMode ? "dark" : "light");
    }, [darkMode]);

  const openModal = (
    title,
    content
  ) => {
    setModal({
      title,
      content,
    });
  };

  const handleLogout = () => {

    localStorage.removeItem("userId");

    navigate("/login");
  };

  const renderPage = () => {

    switch (activeMenu) {

      case "Health Overview":
        return <HealthOverview />;

      case "Recovery":
        return (
          <RecoveryHub
            patientData={patientData}
          />
        );

      case "Health Records":
        return (
          <HealthRecords
            openModal={openModal}
          />
        );

      case "AI Analysis":
        return (
          <AIAnalysis
            openModal={openModal}
          />
        );

      case "Medicines":
        return <Medicines />;

      case "Appointments":
        return <Appointments />;

      case "Alerts":
        return <Alerts />;

      case "Find a Doctor":
        return (
          <div className="page-stack">
            <PageHeader icon="👩‍⚕️" title="Find a Doctor" subtitle="Search and connect with a healthcare specialist" />
            <DoctorConnectionCard patientData={patientData} />
          </div>
        );

      default:
        return (
          <DashboardHome
            openModal={openModal}
            patientData={patientData}
          />
        );
    }
  };

  return (
    <div
      className={`patient-dashboard ${
        darkMode ? "dark-mode" : ""
      }`}
    >
      <NotificationToast onOpenAlerts={() => setActiveMenu("Alerts")} />

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ⚕️
          </div>

          <div className="brand-text">

            <span>
              HealTrack AI
            </span>

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

        <div className="sidebar-bottom">

          <button
            className="bottom-button"
            onClick={() =>
              navigate("/patient/settings")
            }
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>

          <button
            className="logout-button"
            onClick={() => {

              if (
                window.confirm(
                  "Are you sure you want to logout?"
                )
              ) {
                handleLogout();
              }

            }}
          >
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">

        <header className="top-header">
          <div className="search-panel">
            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search dashboard..."
              />
            </div>

            {searchTerm.trim() && searchMatches.length > 0 && (
              <div className="search-results">
                {searchMatches.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setActiveMenu(item.name);
                      setSearchTerm("");
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="header-right">
            <button
              className="mode-button"
              onClick={() => setDarkMode(!darkMode)}
              title="Change mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <button className="notification" onClick={() => setActiveMenu("Alerts")}>
              🔔
              {alertCount > 0 && <span></span>}
            </button>

            <div className="profile-menu-wrap">
              <div
                className="patient-header profile-trigger"
                onClick={() => setShowProfileMenu((value) => !value)}
              >
                <div className="patient-small-avatar">
                  {patientData?.name
                    ? patientData.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                    : ""}
                </div>

                <div>
                  <strong>{patientData?.name}</strong>
                </div>
              </div>

              {showProfileMenu && (
                <div className="profile-menu">
                  <button type="button" onClick={() => { setActiveMenu("Dashboard"); setShowProfileMenu(false); }}>
                    👤 Profile
                  </button>
                  <button type="button" onClick={() => { setActiveMenu("Alerts"); setShowProfileMenu(false); }}>
                    🔔 Alerts
                  </button>
                  <button type="button" onClick={() => { setShowProfileMenu(false); navigate("/patient/settings"); }}>
                    ⚙️ Settings
                  </button>
                  <button type="button" className="logout-link" onClick={() => {
                    setShowProfileMenu(false);
                    if (window.confirm("Are you sure you want to logout?")) handleLogout();
                  }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard-container">
          {renderPage()}
        </section>

      </main>

      {/* =================================================
          MODAL
      ================================================= */}

      {modal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setModal(null)
          }
        >

          <div
            className="modal-box"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setModal(null)
              }
            >
              ✕
            </button>

            <h2>
              {modal.title}
            </h2>

            <p>
              {modal.content}
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setModal(null)
              }
            >
              ✓ Okay
            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default Patient;