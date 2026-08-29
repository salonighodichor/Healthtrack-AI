import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

    fetch(`http://127.0.0.1:5000/api/health-record/${userId}/latest`)
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

    fetch("http://127.0.0.1:5000/api/health-record", {
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
      `http://127.0.0.1:5000/api/recovery-progress/${userId}`
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
  const [recordFiles, setRecordFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState(null);
  
  const userId = localStorage.getItem("userId");
  
  const defaultRecords = [
    { name: "Medical Check Up Report", icon: "🏥" },
    { name: "Blood Count Report", icon: "🩸" },
    { name: "Heart ECG Report", icon: "❤️" },
    { name: "MRI Brain Report", icon: "🧠" },
  ];
  
  const loadRecordFiles = () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetch(`http://127.0.0.1:5000/api/health-records/${userId}/files`)
      .then((response) => response.json())
      .then((data) => {
        setRecordFiles(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching health record files:", error);
        setLoading(false);
      });
  };
  
  useEffect(() => {
    loadRecordFiles();
  }, [userId]);
  
  const handleFileUpload = (e, recordName) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      alert("Please upload a PDF, JPG, JPEG, or PNG file");
      return;
    }
    
    setUploadingFor(recordName);
    
    const formData = new FormData();
    formData.append("file", file);
    
    fetch(`http://127.0.0.1:5000/api/health-records/files/${userId}/${encodeURIComponent(recordName)}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then(() => {
        loadRecordFiles();
        setUploadingFor(null);
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        setUploadingFor(null);
      });
    
    e.target.value = "";
  };
  
  const handleDeleteFile = (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      fetch(`http://127.0.0.1:5000/api/health-records/files/${fileId}`, {
        method: "DELETE",
      })
        .then(() => {
          loadRecordFiles();
        })
        .catch((error) => {
          console.error("Error deleting file:", error);
        });
    }
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

      <div className="dashboard-card">
        <div className="record-list large-list">
          {defaultRecords.map(({ icon, name }) => {
            const attachedFile = recordFiles.find(f => f.record_type === name);
            
            return (
              <div key={name} className="record-item-wrapper">
                <button
                  className="record-item"
                  onClick={() =>
                    openModal(
                      `📄 ${name}`,
                      `Record details for ${name}`
                    )
                  }
                >
                  <div className="record-icon">{icon}</div>

                  <div>
                    <strong>{name}</strong>
                    {attachedFile ? (
                      <p>📎 {attachedFile.filename} • {attachedFile.file_size}</p>
                    ) : (
                      <p style={{ color: "#999" }}>No file attached yet</p>
                    )}
                  </div>

                  <span>→</span>
                </button>
                
                <div className="record-actions">
                  <label className="attach-button">
                    📎 Attach
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, name)}
                      disabled={uploadingFor === name}
                      style={{ display: "none" }}
                    />
                  </label>
                  
                  {attachedFile && (
                    <>
                      <a 
                        href={attachedFile.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-button"
                      >
                        👁️ View
                      </a>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteFile(attachedFile.id)}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   AI ANALYSIS
===================================================== */

const AIAnalysis = ({ openModal }) => (
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
          <h2>🟢 Health Status: Good</h2>
          <p>
            Your recent health parameters are within the normal range.
          </p>
        </div>
      </div>

      <div className="ai-insights">
        <div>
          <strong>💚 Recovery</strong>
          <p>Your recovery is progressing well.</p>
        </div>

        <div>
          <strong>💊 Medication</strong>
          <p>Keep following your prescribed schedule.</p>
        </div>

        <div>
          <strong>💡 Recommendation</strong>
          <p>
            Continue your recovery plan and regular checkups.
          </p>
        </div>
      </div>

      <button
        className="primary-button"
        onClick={() =>
          openModal(
            "🤖 AI Health Analysis",
            "Your detailed AI-generated health analysis will appear here."
          )
        }
      >
        ✨ View Full Analysis
      </button>
    </div>
  </div>
);

/* =====================================================
   MEDICINES
===================================================== */

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  
  const loadMedicines = () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetch(`http://127.0.0.1:5000/api/medicines/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setMedicines(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching medicines:", error);
        setLoading(false);
      });
  };
  
  useEffect(() => {
    loadMedicines();
  }, [userId]);
  
  const markAsTaken = (medicineId) => {
    fetch(`http://127.0.0.1:5000/api/medicines/${medicineId}/taken`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((response) => response.json())
      .then(() => {
        loadMedicines();
      })
      .catch((error) => {
        console.error("Error marking medicine as taken:", error);
      });
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

      <div className="dashboard-card">
        {medicines.length === 0 ? (
          <p>No medicines scheduled for today.</p>
        ) : (
          <div className="medicine-list large-list">
            {medicines.map((medicine) => (
              <div className="medicine-item" key={medicine.id}>
                <div className="medicine-icon">💊</div>

                <div>
                  <strong>{medicine.name}</strong>
                  <p>{medicine.instruction}</p>
                </div>

                <div className="medicine-status-group">
                  <span className={`medicine-status ${medicine.status.toLowerCase()}`}>
                    {medicine.status === "taken" ? "✓ Taken" : "⏰ Pending"}
                  </span>
                  
                  {medicine.status === "pending" && (
                    <button
                      className="mark-taken-button"
                      onClick={() => markAsTaken(medicine.id)}
                    >
                      Mark as Taken
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    doctor_name: "",
    date: "",
    time: "",
    location: "",
    appointment_type: "In-person",
    notes: "",
  });
  
  const userId = localStorage.getItem("userId");
  
  const loadAppointments = () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetch(`http://127.0.0.1:5000/api/appointments/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      });
  };
  
  useEffect(() => {
    loadAppointments();
  }, [userId]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleAddAppointment = () => {
    if (!formData.title || !formData.date || !userId) {
      alert("Please fill in all required fields");
      return;
    }
    
    fetch("http://127.0.0.1:5000/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        title: formData.title,
        doctor_name: formData.doctor_name,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        appointment_type: formData.appointment_type,
        notes: formData.notes,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        setFormData({
          title: "",
          doctor_name: "",
          date: "",
          time: "",
          location: "",
          appointment_type: "In-person",
          notes: "",
        });
        setShowAddForm(false);
        loadAppointments();
      })
      .catch((error) => {
        console.error("Error adding appointment:", error);
        alert("Error adding appointment");
      });
  };
  
  const handleReschedule = (appointment) => {
    setEditingId(appointment.id);
    setFormData({
      title: appointment.title,
      doctor_name: appointment.doctor_name || "",
      date: appointment.date ? appointment.date.split(" ")[0] : "",
      time: appointment.time || "",
      location: appointment.location || "",
      appointment_type: appointment.appointment_type || "In-person",
      notes: appointment.notes || "",
    });
  };
  
  const handleUpdateAppointment = () => {
    if (!formData.date) {
      alert("Please select a date");
      return;
    }
    
    fetch(`http://127.0.0.1:5000/api/appointments/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.notes,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        setEditingId(null);
        setFormData({
          title: "",
          doctor_name: "",
          date: "",
          time: "",
          location: "",
          appointment_type: "In-person",
          notes: "",
        });
        loadAppointments();
      })
      .catch((error) => {
        console.error("Error updating appointment:", error);
        alert("Error updating appointment");
      });
  };
  
  const handleCancelAppointment = (appointmentId, appointmentTitle) => {
    if (window.confirm(`Are you sure you want to cancel "${appointmentTitle}"?`)) {
      fetch(`http://127.0.0.1:5000/api/appointments/${appointmentId}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then(() => {
          loadAppointments();
        })
        .catch((error) => {
          console.error("Error canceling appointment:", error);
          alert("Error canceling appointment");
        });
    }
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
      case "scheduled":
        return "status-scheduled";
      case "completed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      case "missed":
        return "status-missed";
      default:
        return "status-scheduled";
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

      <button
        className="primary-button"
        onClick={() => {
          setShowAddForm(!showAddForm);
          setEditingId(null);
          setFormData({
            title: "",
            doctor_name: "",
            date: "",
            time: "",
            location: "",
            appointment_type: "In-person",
            notes: "",
          });
        }}
        style={{ width: "fit-content", marginBottom: "16px" }}
      >
        {showAddForm ? "✕ Cancel" : "+ Add Appointment"}
      </button>

      {showAddForm && (
        <div className="dashboard-card">
          <div className="card-title">
            <div>
              <h2>📝 Add New Appointment</h2>
              <p>Schedule an appointment with your doctor</p>
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
              <label>Appointment Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Blood Test"
              />
            </div>

            <div>
              <label>Doctor Name</label>
              <input
                type="text"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleInputChange}
                placeholder="Dr. Name"
              />
            </div>

            <div>
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Hospital/Clinic name"
              />
            </div>

            <div>
              <label>Type</label>
              <select
                name="appointment_type"
                value={formData.appointment_type}
                onChange={handleInputChange}
              >
                <option>In-person</option>
                <option>Video Call</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional notes..."
                rows="3"
              />
            </div>
          </div>

          <button
            className="primary-button"
            onClick={handleAddAppointment}
            style={{ marginTop: "16px" }}
          >
            ✓ Save Appointment
          </button>
        </div>
      )}

      <div className="dashboard-card">
        {appointments.length === 0 ? (
          <p>No appointments scheduled yet.</p>
        ) : (
          <div className="appointment-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                {editingId === appointment.id ? (
                  <div className="appointment-edit-form">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label>Date</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label>Time</label>
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                      <button
                        className="primary-button"
                        onClick={handleUpdateAppointment}
                        style={{ flex: 1 }}
                      >
                        ✓ Update
                      </button>
                      <button
                        className="outline-button"
                        onClick={() => setEditingId(null)}
                        style={{ flex: 1 }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="appointment-details">
                      <h3>{appointment.title}</h3>
                      {appointment.doctor_name && <p>👨‍⚕️ Doctor: {appointment.doctor_name}</p>}
                      <p>📅 {appointment.date}</p>
                      {appointment.time && <p>⏰ {appointment.time}</p>}
                      {appointment.location && <p>📍 {appointment.location}</p>}
                      {appointment.appointment_type && <p>🎯 {appointment.appointment_type}</p>}
                      {appointment.notes && <p>📝 {appointment.notes}</p>}
                    </div>

                    <div className="appointment-actions">
                      <span className={`appointment-status ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>

                      {appointment.status?.toLowerCase() !== "cancelled" && 
                       appointment.status?.toLowerCase() !== "completed" && (
                        <>
                          <button
                            className="reschedule-button"
                            onClick={() => handleReschedule(appointment)}
                          >
                            ✏️ Reschedule
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() =>
                              handleCancelAppointment(appointment.id, appointment.title)
                            }
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
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

    fetch(`http://127.0.0.1:5000/api/alerts/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching alerts:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAlerts();
  }, [userId]);

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
              <div className={`alert-item ${alert.type}`} key={alert.id}>
                <span>{iconFor(alert.type)}</span>
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                </div>
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

  fetch(`http://127.0.0.1:5000/api/recovery-tasks/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch recovery tasks");
      }

      return response.json();
    })
    .then((tasks) => {
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
      `http://127.0.0.1:5000/api/recovery-tasks/${taskId}`,
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
      `http://127.0.0.1:5000/api/recovery-tasks`,
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
      `http://127.0.0.1:5000/api/recovery-tasks/${taskId}`,
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
      `http://127.0.0.1:5000/api/recovery-tasks/${taskId}`,
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
      `http://127.0.0.1:5000/api/daily-activities/${userId}`
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
      `http://127.0.0.1:5000/api/daily-activities/${activity.id}`,
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
      `http://127.0.0.1:5000/api/daily-activities/${userId}`
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
      `http://127.0.0.1:5000/api/dashboard-progress/${userId}?range=${progressRange}`
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
      `http://127.0.0.1:5000/api/patient/${userId}`
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

    fetch(`http://127.0.0.1:5000/api/check-reminders/${userId}`).catch(
      (error) => console.error("Error checking reminders:", error)
    );

  }, []);

    const [activeMenu, setActiveMenu] =
    useState("Dashboard");

  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) return;

    fetch(`http://127.0.0.1:5000/api/alerts/${userId}`)
      .then((response) => response.json())
      .then((data) => setAlertCount(data.length))
      .catch((error) =>
        console.error("Error fetching alert count:", error)
      );
  }, [activeMenu]);

  const [modal, setModal] =
    useState(null);

  const [darkMode, setDarkMode] =
    useState(false);

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

          <div className="search-box">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search health records..."
            />

          </div>

          <div className="header-right">

            <button
              className="mode-button"
              onClick={() =>
                setDarkMode(!darkMode)
              }
              title="Change mode"
            >
              {darkMode
                ? "☀️"
                : "🌙"}
            </button>

                        <button
              className="notification"
              onClick={() => setActiveMenu("Alerts")}
            >
              🔔
              {alertCount > 0 && <span></span>}
            </button>

            <div className="patient-header">

              <div className="patient-small-avatar">

                {patientData?.name
                  ? patientData.name
                      .split(" ")
                      .map(
                        (w) => w[0]
                      )
                      .join("")
                      .toUpperCase()
                  : ""}

              </div>

              <div>
                <strong>
                  {patientData?.name}
                </strong>
              </div>

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