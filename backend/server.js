const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const uploadsDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const users = [
  {
    id: 1,
    name: "Rani",
    email: "rani@example.com",
    phone: "9876543210",
    password: "rani123",
    role: "patient",
    age: 30,
    gender: "Female",
    recoveryType: "Post-surgery recovery",
    emergencyContact: "9988776655",
    doctorId: 101,
    caretakerId: 201,
    notifications: { medicineReminder: true, appointmentReminder: true, emailNotifications: true },
    language: "English",
    healthPreferences: { bloodGroup: "O+", allergies: "None", conditions: "Anemia", emergencyName: "Asha", emergencyPhone: "9988776655", height: "160", weight: "60", healthGoal: "General Fitness" },
    aiPreferences: { aiAssistant: true, healthSuggestions: true, medicationSuggestions: true, language: "English", responseStyle: "Simple" },
    devices: [{ id: 1, name: "Smart Watch", type: "Fitness & Health", connected: true }, { id: 2, name: "Blood Pressure Monitor", type: "Blood Pressure", connected: false }],
  },
  {
    id: 2,
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "9123456780",
    password: "aarav123",
    role: "patient",
    age: 27,
    gender: "Male",
    recoveryType: "Cardiac rehab",
    emergencyContact: "9765432100",
    doctorId: 101,
    caretakerId: 202,
  },
  {
    id: 101,
    name: "Dr. Ravi Verma",
    email: "ravi@healtrack.ai",
    phone: "9898989898",
    password: "doctor123",
    role: "doctor",
    specialization: "Cardiologist",
    experience: "8 years",
    hospitalClinic: "City Care Hospital",
    patients: [1, 2],
  },
  {
    id: 201,
    name: "Asha",
    email: "asha@healtrack.ai",
    phone: "9876123456",
    password: "caretaker123",
    role: "caretaker",
    relationship: "Mother",
    patientId: 1,
  },
  {
    id: 202,
    name: "Neha",
    email: "neha@healtrack.ai",
    phone: "9988776655",
    password: "caretaker123",
    role: "caretaker",
    relationship: "Sister",
    patientId: 2,
  },
];

const healthRecords = [
  { id: 1, user_id: 1, blood_sugar: 118, heart_rate: 76, systolic: 118, diastolic: 78, hemoglobin: 12.6, recorded_at: "2026-08-29T08:00:00.000Z" },
  { id: 2, user_id: 1, blood_sugar: 132, heart_rate: 120, systolic: 128, diastolic: 82, hemoglobin: 12.2, recorded_at: "2026-08-29T12:30:00.000Z" },
  { id: 3, user_id: 2, blood_sugar: 110, heart_rate: 74, systolic: 116, diastolic: 76, hemoglobin: 13.4, recorded_at: "2026-08-29T09:15:00.000Z" },
];

const recoveryTasks = [
  { id: 1, user_id: 1, title: "Morning stretch", status: "completed", completed_at: "2026-08-29T07:15:00.000Z" },
  { id: 2, user_id: 1, title: "Take Vitamin D", status: "completed", completed_at: "2026-08-29T08:20:00.000Z" },
  { id: 3, user_id: 1, title: "Evening walk", status: "pending" },
  { id: 4, user_id: 1, title: "Hydration check", status: "pending" },
  { id: 5, user_id: 2, title: "Cardio warm-up", status: "completed", completed_at: "2026-08-29T06:45:00.000Z" },
  { id: 6, user_id: 2, title: "Track blood pressure", status: "pending" },
];

const medications = [
  { id: 1, user_id: 1, name: "Aspirin 75mg", dosage: "75mg", frequency: "Once daily", timing: "after breakfast", instruction: "1 tablet • After breakfast", status: "taken", scheduledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: 2, user_id: 1, name: "Atorvastatin 10mg", dosage: "10mg", frequency: "Once daily", timing: "after dinner", instruction: "1 tablet • After dinner", status: "pending", scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() },
  { id: 3, user_id: 1, name: "Metoprolol 25mg", dosage: "25mg", frequency: "Once daily", timing: "morning", instruction: "1 tablet • Morning", status: "taken", scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 4, user_id: 2, name: "Vitamin D", dosage: "1000IU", frequency: "Once daily", timing: "morning", instruction: "1 tablet • Morning", status: "taken", scheduledAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 5, user_id: 2, name: "Omega-3", dosage: "500mg", frequency: "Once daily", timing: "evening", instruction: "1 capsule • Evening", status: "pending", scheduledAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() },
];

const appointments = [
  { id: 1, user_id: 1, title: "Cardiology Follow-up", type: "Doctor appointment", time: "10:30 AM", location: "Room 204", status: "upcoming", date: "2026-04-20" },
  { id: 2, user_id: 1, title: "Blood Test", type: "Diagnostic Center", time: "09:00 AM", location: "Lab 3", status: "scheduled", date: "2026-04-25" },
  { id: 3, user_id: 2, title: "Physio Session", type: "Recovery therapy", time: "11:00 AM", location: "Therapy Wing", status: "upcoming", date: "2026-04-22" },
];

const doctors = [
  { id: 101, name: "Dr. Ravi Verma", specialization: "Cardiologist", hospitalClinic: "City Care Hospital", experience: "8 years" },
  { id: 102, name: "Dr. Meera Shah", specialization: "Orthopedic Surgeon", hospitalClinic: "Apollo Recovery Center", experience: "12 years" },
  { id: 103, name: "Dr. Aditi Nair", specialization: "Internal Medicine", hospitalClinic: "MediWell Hospital", experience: "10 years" },
];

const dailyActivities = [
  { id: 1, user_id: 1, type: "walk", label: "Evening walk", duration: 20, unit: "minutes", completed: true },
  { id: 2, user_id: 1, type: "hydration", label: "Hydration goal", duration: 2, unit: "L", completed: false },
  { id: 3, user_id: 2, type: "stretch", label: "Morning stretch", duration: 15, unit: "minutes", completed: true },
  { id: 4, user_id: 2, type: "sleep", label: "Sleep quality check", duration: 8, unit: "hours", completed: false },
];

const healthDocumentTypes = ["Lab Report", "Prescription", "Discharge Summary", "Scan Report", "Clinical Notes"];

const documents = [
  { id: 1, user_id: 1, recordType: "Lab Report", title: "CBC Report", fileName: "cbc-report.pdf", mimeType: "application/pdf", fileSize: "420 KB", uploadedAt: "2026-08-29T09:00:00.000Z", filePath: "" },
  { id: 2, user_id: 1, recordType: "Prescription", title: "Medication Prescription", fileName: "meds-post-op.pdf", mimeType: "application/pdf", fileSize: "210 KB", uploadedAt: "2026-08-28T11:15:00.000Z", filePath: "" },
];

const notifications = [
  { id: 1, user_id: 1, title: "Medication Reminder", message: "1 medicine reminder is still pending.", type: "info", read: false, createdAt: new Date().toISOString() },
  { id: 2, user_id: 1, title: "Appointment Reminder", message: "Cardiology follow-up is coming up soon.", type: "warning", read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
];

const getStatusForValue = (metric, value) => {
  if (value === null || value === undefined || value === "") return { value: null, status: "unknown" };
  if (metric === "blood_sugar") {
    if (value > 140) return { value, status: "high" };
    if (value < 70) return { value, status: "low" };
    return { value, status: "normal" };
  }
  if (metric === "heart_rate") {
    if (value > 100) return { value, status: "high" };
    if (value < 60) return { value, status: "low" };
    return { value, status: "normal" };
  }
  if (metric === "blood_pressure") {
    const systolic = value.systolic;
    const diastolic = value.diastolic;
    if (systolic > 120 || diastolic > 80) return { value, status: "high" };
    if (systolic < 90 || diastolic < 60) return { value, status: "low" };
    return { value, status: "normal" };
  }
  if (metric === "hemoglobin") {
    if (value < 11) return { value, status: "low" };
    if (value > 16) return { value, status: "high" };
    return { value, status: "normal" };
  }
  return { value, status: "normal" };
};

const getPatientById = (id) => users.find((user) => user.role === "patient" && Number(user.id) === Number(id));
const getDoctorById = (id) => users.find((user) => user.role === "doctor" && Number(user.id) === Number(id))
  || (typeof doctors !== "undefined" ? doctors.find((doctor) => Number(doctor.id) === Number(id)) : null);
const getCaretakerById = (id) => users.find((user) => user.role === "caretaker" && Number(user.id) === Number(id));

const getLatestHealthRecord = (userId) => {
  const record = [...healthRecords].reverse().find((entry) => Number(entry.user_id) === Number(userId));
  if (!record) return { has_data: false };
  const blood_sugar = getStatusForValue("blood_sugar", record.blood_sugar);
  const heart_rate = getStatusForValue("heart_rate", record.heart_rate);
  const blood_pressure = getStatusForValue("blood_pressure", { systolic: record.systolic, diastolic: record.diastolic });
  const hemoglobin = getStatusForValue("hemoglobin", record.hemoglobin);
  return { has_data: true, blood_sugar, heart_rate, blood_pressure, hemoglobin, recorded_at: new Date(record.recorded_at).toLocaleString() };
};

const getPatientNotificationSettings = (userId) => {
  const patient = getPatientById(userId);
  const defaults = { enabled: true, appNotifications: true, smsNotifications: true, medicineReminder: true, appointmentReminder: true, emailNotifications: true };
  if (!patient) return defaults;
  const existing = patient.notificationPreferences || patient.notifications || {};
  return { ...defaults, ...existing };
};

const savePatientNotificationSettings = (userId, updates = {}) => {
  const patient = getPatientById(userId);
  if (!patient) return null;
  const current = getPatientNotificationSettings(userId);
  const merged = { ...current, ...updates };
  patient.notificationPreferences = merged;
  patient.notifications = { ...(patient.notifications || {}), ...merged };
  return merged;
};

const sendSmsNotification = async (userId, message) => {
  const patient = getPatientById(userId);
  const settings = getPatientNotificationSettings(userId);
  if (!patient || !patient.phone) return { skipped: true, reason: "missing_phone" };
  if (!settings.enabled || !settings.smsNotifications) return { skipped: true, reason: "sms_disabled" };

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[SMS stub] To ${patient.phone}: ${message}`);
    return { stubbed: true, to: patient.phone };
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: patient.phone, From: fromNumber, Body: message }).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Twilio SMS failed:", text);
      return { skipped: true, reason: "sms_failed" };
    }

    return { sent: true, to: patient.phone };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { skipped: true, reason: "sms_error" };
  }
};

const createNotification = async (userId, title, message, type = "info", critical = false) => {
  const notification = { id: Date.now() + Math.random(), user_id: Number(userId), title, message, type, read: false, critical, createdAt: new Date().toISOString() };
  notifications.push(notification);

  const settings = getPatientNotificationSettings(userId);
  if (critical && settings.enabled !== false && settings.smsNotifications !== false) {
    await sendSmsNotification(userId, `${title}: ${message}`);
  }

  return notification;
};

const resolveMedicineScheduleTime = (timing, baseDate = new Date()) => {
  const normalized = String(timing || "morning").toLowerCase().trim();
  const scheduled = new Date(baseDate);
  const lookup = {
    morning: 8,
    "after breakfast": 9,
    breakfast: 9,
    afternoon: 13,
    "after lunch": 13,
    lunch: 13,
    evening: 18,
    "after dinner": 20,
    dinner: 20,
    night: 21,
    bedtime: 21,
  };

  const hour = lookup[normalized] ?? 9;
  scheduled.setHours(hour, 0, 0, 0);
  if (scheduled <= baseDate) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled.toISOString();
};

const checkMissedMedicines = () => {
  medications.forEach((medicine) => {
    if (String(medicine.status).toLowerCase() !== "pending") return;
    const dueTime = new Date(medicine.scheduledAt || new Date());
    if (dueTime <= new Date()) {
      medicine.status = "missed";
      createNotification(medicine.user_id, "Missed Medicine", `${medicine.name} was not marked as taken on time.`, "warning", true);
    }
  });
};

const computeRecoveryMetrics = (userId) => {
  const tasks = recoveryTasks.filter((task) => Number(task.user_id) === Number(userId));
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter((task) => String(task.status).toLowerCase() === "completed").length;
  const physicalRecovery = Math.round((completedTasks / totalTasks) * 100);

  const meds = medications.filter((medicine) => Number(medicine.user_id) === Number(userId));
  const totalMeds = meds.length || 1;
  const takenMeds = meds.filter((medicine) => String(medicine.status).toLowerCase() === "taken").length;
  const medicationRecovery = Math.round((takenMeds / totalMeds) * 100);

  const activities = dailyActivities.filter((activity) => Number(activity.user_id) === Number(userId));
  const totalActivities = activities.length || 1;
  const completedActivities = activities.filter((activity) => activity.completed).length;
  const dailyActivity = Math.round((completedActivities / totalActivities) * 100);

  const latestRecord = getLatestHealthRecord(userId);
  let labFactor = 100;
  if (latestRecord.has_data) {
    const values = [latestRecord.blood_sugar.status, latestRecord.heart_rate.status, latestRecord.blood_pressure.status, latestRecord.hemoglobin.status];
    const abnormal = values.filter((status) => status === "high" || status === "low").length;
    labFactor = Math.max(0, 100 - abnormal * 22);
  }

  const overall = Math.round((physicalRecovery * 0.35 + medicationRecovery * 0.35 + dailyActivity * 0.2 + labFactor * 0.1));

  return { physicalRecovery, medicationRecovery, dailyActivity, labFactor, overall, activities: { total: activities.length, completed: completedActivities }, tasks: { total: tasks.length, completed: completedTasks } };
};

const getPersonalizedAiSummary = (userId) => {
  const patient = getPatientById(userId);
  const latest = getLatestHealthRecord(userId);
  const metrics = computeRecoveryMetrics(userId);
  const pendingMedicines = medications.filter((medicine) => Number(medicine.user_id) === Number(userId) && String(medicine.status).toLowerCase() === "pending").length;
  const nextAppointment = appointments.find((appointment) => Number(appointment.user_id) === Number(userId) && String(appointment.status).toLowerCase() !== "completed");

  let healthStatus = "Good";
  if (latest.has_data) {
    const statuses = [latest.blood_sugar.status, latest.heart_rate.status, latest.blood_pressure.status, latest.hemoglobin.status];
    if (statuses.some((status) => status === "high" || status === "low") || metrics.overall < 60) healthStatus = "Needs attention";
  }

  const summary = latest.has_data ? `Your recent health indicators are mostly stable, with a ${metrics.overall}% recovery trend this week.` : "You have not logged recent vitals yet. Add your next reading to get a more accurate health summary.";
  const recommendation = pendingMedicines > 0 ? `Please complete your remaining ${pendingMedicines} medication task(s) and continue the recovery plan.` : nextAppointment ? `You have an upcoming ${nextAppointment.title.toLowerCase()} on ${nextAppointment.date}. Please keep your routine and hydration steady.` : "Continue your recovery plan and check in with your doctor if symptoms change.";

  return { status: healthStatus, health_score: metrics.overall, summary, insight: `Recovery is ${metrics.overall}% complete with ${metrics.physicalRecovery}% physical progress and ${metrics.medicationRecovery}% medication adherence.`, recommendation, patientName: patient ? patient.name : "Patient", alerts: pendingMedicines };
};

const getAiResponse = (userId, prompt) => {
  const patient = getPatientById(userId);
  const latest = getLatestHealthRecord(userId);
  const metrics = computeRecoveryMetrics(userId);
  const pendingMedicines = medications.filter((m) => Number(m.user_id) === Number(userId) && String(m.status).toLowerCase() === "pending");
  const nextAppointment = appointments.find((appointment) => Number(appointment.user_id) === Number(userId) && String(appointment.status).toLowerCase() !== "completed");
  const text = String(prompt || "").toLowerCase();

  if (text.includes("medicine") || text.includes("medication") || text.includes("pill")) {
    if (pendingMedicines.length > 0) {
      return `You currently have ${pendingMedicines.length} pending medication(s). Please complete ${pendingMedicines.map((item) => item.name).join(", ")}. Your current medication adherence is ${metrics.medicationRecovery}%.`;
    }
    return `All current medications appear to be on track. Your medication adherence is ${metrics.medicationRecovery}%.`;
  }

  if (text.includes("appointment") || text.includes("visit") || text.includes("doctor")) {
    if (nextAppointment) {
      return `${patient?.name || "You"} has a ${nextAppointment.title} scheduled for ${nextAppointment.date} at ${nextAppointment.time}.`;
    }
    return "There are no upcoming appointments scheduled right now.";
  }

  if (text.includes("recovery") || text.includes("progress") || text.includes("improving")) {
    return `Your overall recovery is ${metrics.overall}%. Physical recovery is ${metrics.physicalRecovery}%, medication adherence is ${metrics.medicationRecovery}%, and daily activity completion is ${metrics.dailyActivity}%.`;
  }

  if (text.includes("vital") || text.includes("heart") || text.includes("blood")) {
    if (!latest.has_data) return "No recent vitals are available yet. Record your latest readings to get a personalized insight.";
    return `Your latest readings show blood sugar ${latest.blood_sugar.value ?? "N/A"}, heart rate ${latest.heart_rate.value ?? "N/A"}, and blood pressure ${latest.blood_pressure.value?.systolic ?? "N/A"}/${latest.blood_pressure.value?.diastolic ?? "N/A"}. The current trend is ${latest.heart_rate.status === "normal" ? "stable" : latest.heart_rate.status}.`;
  }

  return `Based on your health history, your recovery score is ${metrics.overall}%, with medication adherence at ${metrics.medicationRecovery}% and daily activity at ${metrics.dailyActivity}%. Staying consistent with your medications and routine is the best next step.`;
};

app.get("/", (req, res) => {
  res.json({ message: "HealTrack AI Backend is running!" });
});

app.post("/api/register/patient", (req, res) => {
  const { fullName, email, phone, password, age, gender, recoveryType, emergencyContact } = req.body;
  if (!fullName || !email || !phone || !password || !gender) return res.status(400).json({ message: "Please fill all required patient fields." });
  if (users.some((user) => String(user.email).toLowerCase() === String(email).toLowerCase())) return res.status(409).json({ message: "An account with this email already exists." });
  const patient = { id: Date.now(), name: fullName, email, phone, password, role: "patient", age, gender, recoveryType, emergencyContact, doctorId: 101, caretakerId: 201, notifications: { medicineReminder: true, appointmentReminder: true, emailNotifications: true }, language: "English", healthPreferences: { bloodGroup: "", allergies: "", conditions: "", emergencyName: "", emergencyPhone: "", height: "", weight: "", healthGoal: "General Fitness" }, aiPreferences: { aiAssistant: true, healthSuggestions: true, medicationSuggestions: true, language: "English", responseStyle: "Simple" }, devices: [{ id: 1, name: "Smart Watch", type: "Fitness & Health", connected: true }, { id: 2, name: "Blood Pressure Monitor", type: "Blood Pressure", connected: false }] };
  users.push(patient);
  return res.status(201).json({ message: "Patient registration successful", user: { id: patient.id, name: patient.name, role: patient.role } });
});

app.post("/api/register/doctor", (req, res) => {
  const { fullName, email, phone, password, medicalRegistrationNo, specialization, hospitalClinic, experience } = req.body;
  if (!fullName || !email || !phone || !password || !medicalRegistrationNo) return res.status(400).json({ message: "Please fill all required doctor fields." });
  if (users.some((user) => String(user.email).toLowerCase() === String(email).toLowerCase())) return res.status(409).json({ message: "A doctor account with this email already exists." });
  const doctor = { id: Date.now(), name: fullName, email, phone, password, role: "doctor", medicalRegistrationNo, specialization, hospitalClinic, experience, patients: [] };
  users.push(doctor);
  return res.status(201).json({ message: "Doctor registration successful", user: { id: doctor.id, name: doctor.name, role: doctor.role } });
});

app.post("/api/register/caretaker", (req, res) => {
  const { fullName, email, phone, password, relationship, patientId } = req.body;
  if (!fullName || !email || !phone || !password || !relationship || !patientId) return res.status(400).json({ message: "Please fill all required caretaker fields." });
  if (users.some((user) => String(user.email).toLowerCase() === String(email).toLowerCase())) return res.status(409).json({ message: "A caretaker account with this email already exists." });
  const caretaker = { id: Date.now(), name: fullName, email, phone, password, role: "caretaker", relationship, patientId: Number(patientId) };
  users.push(caretaker);
  return res.status(201).json({ message: "Caretaker registration successful", user: { id: caretaker.id, name: caretaker.name, role: caretaker.role } });
});

app.post("/api/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ message: "Email, password and role are required." });
  const user = users.find((entry) => entry.role === String(role).toLowerCase() && String(entry.email).toLowerCase() === String(email).toLowerCase() && entry.password === String(password));
  if (!user) return res.status(401).json({ message: "Invalid email, password or role." });
  return res.json({ message: "Login successful", user: { id: user.id, name: user.name, role: user.role, email: user.email } });
});

app.get("/api/patient/:id", (req, res) => {
  const patient = getPatientById(req.params.id);
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  const doctor = getDoctorById(patient.doctorId || 101);
  const caretaker = getCaretakerById(patient.caretakerId || 201);
  return res.json({ id: patient.id, name: patient.name, email: patient.email, phone: patient.phone, age: patient.age, gender: patient.gender, recoveryType: patient.recoveryType, bloodGroup: patient.healthPreferences?.bloodGroup || "", emergencyContact: patient.emergencyContact || "", assignedDoctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization } : null, assignedCaretaker: caretaker ? { id: caretaker.id, name: caretaker.name, relationship: caretaker.relationship } : null, notifications: patient.notifications || { medicineReminder: true, appointmentReminder: true, emailNotifications: true }, healthPreferences: patient.healthPreferences || {}, aiPreferences: patient.aiPreferences || {}, language: patient.language || "English", devices: patient.devices || [] });
});

app.get("/api/health-record/:userId/latest", (req, res) => {
  return res.json(getLatestHealthRecord(req.params.userId));
});

app.get("/api/health-record/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const records = healthRecords.filter((entry) => Number(entry.user_id) === userId);
  return res.json({ records });
});

app.post("/api/health-record", (req, res) => {
  const { user_id, blood_sugar, heart_rate, systolic, diastolic, hemoglobin } = req.body;
  if (!user_id) return res.status(400).json({ message: "user_id is required." });
  const record = { id: Date.now(), user_id: Number(user_id), blood_sugar: blood_sugar !== undefined && blood_sugar !== null && blood_sugar !== "" ? Number(blood_sugar) : null, heart_rate: heart_rate !== undefined && heart_rate !== null && heart_rate !== "" ? Number(heart_rate) : null, systolic: systolic !== undefined && systolic !== null && systolic !== "" ? Number(systolic) : null, diastolic: diastolic !== undefined && diastolic !== null && diastolic !== "" ? Number(diastolic) : null, hemoglobin: hemoglobin !== undefined && hemoglobin !== null && hemoglobin !== "" ? Number(hemoglobin) : null, recorded_at: new Date().toISOString() };
  healthRecords.push(record);
  createNotification(Number(user_id), "Health Update Added", "Your latest vitals were recorded successfully.", "success");
  return res.status(201).json({ message: "Health record saved successfully", record });
});

app.get("/api/records/:userId/types", (req, res) => {
  const userId = Number(req.params.userId);
  const grouped = healthDocumentTypes.map((recordType) => ({ recordType, documents: documents.filter((doc) => Number(doc.user_id) === userId && doc.recordType === recordType) }));
  return res.json({ categories: grouped });
});

app.get("/api/documents/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  return res.json({ documents: documents.filter((doc) => Number(doc.user_id) === userId) });
});

app.post("/api/documents/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const { recordType, title, fileName, fileSize, mimeType, fileData } = req.body || {};
  if (!userId || !recordType || !title || !fileName || !fileData) return res.status(400).json({ message: "Missing document details." });
  const matches = fileData.match(/^data:(.*?);base64,(.*)$/);
  if (!matches) return res.status(400).json({ message: "File data must be base64 encoded." });
  const [, detectedMime, base64Content] = matches;
  const finalMime = mimeType || detectedMime || "application/octet-stream";
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
  const document = { id: Date.now(), user_id: userId, recordType, title, fileName, mimeType: finalMime, fileSize: fileSize || `${Math.max(1, Math.round(Buffer.byteLength(base64Content, "base64") / 1024))} KB`, uploadedAt: new Date().toISOString(), filePath };
  documents.push(document);
  createNotification(userId, "Document Uploaded", `${title} was added to ${recordType}.`, "success");
  return res.status(201).json({ message: "Document uploaded successfully", document });
});

app.get("/api/ai-analysis/:userId", (req, res) => {
  return res.json(getPersonalizedAiSummary(Number(req.params.userId)));
});

app.post("/api/chat/ai", (req, res) => {
  const { userId, message } = req.body || {};
  if (!userId || !message) return res.status(400).json({ message: "Both userId and message are required." });
  return res.json({ reply: getAiResponse(userId, message), at: new Date().toISOString() });
});

app.all("/api/medicines", (req, res, next) => {
  if (req.method === "GET") {
    const patientId = Number(req.query.user_id || req.query.patientId || 1);
    checkMissedMedicines();
    return res.json({ medicines: medications.filter((medicine) => Number(medicine.user_id) === patientId) });
  }

  if (req.method === "POST") {
    const { user_id, name, dosage, frequency, timing, scheduledAt } = req.body || {};
    if (!user_id || !name || !dosage || !frequency || !timing) return res.status(400).json({ message: "Medication details are required." });
    const calculatedTime = scheduledAt ? new Date(scheduledAt) : new Date(resolveMedicineScheduleTime(timing, new Date()));
    const medicine = {
      id: Date.now(),
      user_id: Number(user_id),
      name,
      dosage,
      frequency,
      timing,
      instruction: `${dosage} • ${timing}`,
      status: "pending",
      scheduledAt: calculatedTime.toISOString(),
    };
    medications.push(medicine);
    createNotification(Number(user_id), "New Medicine Added", `${name} has been scheduled for ${timing}.`, "info");
    return res.status(201).json({ message: "Medicine added successfully", medicine });
  }

  return next();
});

app.get("/api/medicines/:patientId", (req, res) => {
  const patientId = Number(req.params.patientId);
  checkMissedMedicines();
  return res.json({ medicines: medications.filter((medicine) => Number(medicine.user_id) === patientId) });
});

app.post("/api/medicines", (req, res) => {
  const { user_id, name, dosage, frequency, timing, scheduledAt } = req.body || {};
  if (!user_id || !name || !dosage || !frequency || !timing) return res.status(400).json({ message: "Medication details are required." });
  const calculatedTime = scheduledAt ? new Date(scheduledAt) : new Date(resolveMedicineScheduleTime(timing, new Date()));
  const medicine = {
    id: Date.now(),
    user_id: Number(user_id),
    name,
    dosage,
    frequency,
    timing,
    instruction: `${dosage} • ${timing}`,
    status: "pending",
    scheduledAt: calculatedTime.toISOString(),
  };
  medications.push(medicine);
  createNotification(Number(user_id), "New Medicine Added", `${name} has been scheduled for ${timing}.`, "info");
  return res.status(201).json({ message: "Medicine added successfully", medicine });
});

app.all("/api/medicines/:id/status", (req, res, next) => {
  if (req.method !== "PUT") return next();
  const medicine = medications.find((item) => Number(item.id) === Number(req.params.id));
  if (!medicine) return res.status(404).json({ message: "Medicine not found" });
  const { status } = req.body || {};
  const nextStatus = String(status || "pending").toLowerCase();
  if (!["pending", "taken", "missed"].includes(nextStatus)) return res.status(400).json({ message: "Status must be pending, taken, or missed." });
  const scheduled = new Date(medicine.scheduledAt || new Date());
  if (nextStatus === "taken" && scheduled > new Date()) return res.status(400).json({ message: "You cannot mark a future medicine as taken before its scheduled time." });
  medicine.status = nextStatus;
  if (nextStatus === "missed") createNotification(medicine.user_id, "Medication Missed", `${medicine.name} was missed and added to alerts.`, "warning", true);
  return res.json({ message: "Medicine status updated", medicine });
});

app.put("/api/medicines/:id/status", (req, res) => {
  const medicine = medications.find((item) => Number(item.id) === Number(req.params.id));
  if (!medicine) return res.status(404).json({ message: "Medicine not found" });
  const { status } = req.body || {};
  const nextStatus = String(status || "pending").toLowerCase();
  if (!["pending", "taken", "missed"].includes(nextStatus)) return res.status(400).json({ message: "Status must be pending, taken, or missed." });
  const scheduled = new Date(medicine.scheduledAt || new Date());
  if (nextStatus === "taken" && scheduled > new Date()) return res.status(400).json({ message: "You cannot mark a future medicine as taken before its scheduled time." });
  medicine.status = nextStatus;
  if (nextStatus === "missed") createNotification(medicine.user_id, "Medication Missed", `${medicine.name} was missed and added to alerts.`, "warning", true);
  return res.json({ message: "Medicine status updated", medicine });
});

app.get("/api/appointments", (req, res) => {
  const patientId = Number(req.query.user_id || req.query.patientId || 0);
  if (!patientId) {
    return res.json({ appointments: appointments.slice().sort((a, b) => new Date(a.date) - new Date(b.date)) });
  }
  return res.json({ appointments: appointments.filter((appointment) => Number(appointment.user_id) === patientId).sort((a, b) => new Date(a.date) - new Date(b.date)) });
});

app.get("/api/appointments/:patientId", (req, res) => {
  const patientId = Number(req.params.patientId);
  return res.json({ appointments: appointments.filter((appointment) => Number(appointment.user_id) === patientId).sort((a, b) => new Date(a.date) - new Date(b.date)) });
});

app.post("/api/appointments", (req, res) => {
  const { user_id, title, type, date, time, location, status, department, doctorId, reason } = req.body || {};
  if (!user_id || !title || !date || !time) return res.status(400).json({ message: "Date, time, and title are required." });
  const appointment = {
    id: Date.now(),
    user_id: Number(user_id),
    title,
    type: type || department || "Doctor appointment",
    date,
    time,
    location: location || "Selected clinic",
    status: status || "pending",
    department: department || type || "General Consultation",
    doctorId: doctorId || null,
    reason: reason || "",
    createdAt: new Date().toISOString(),
  };
  appointments.push(appointment);
  createNotification(Number(user_id), "Appointment Requested", `${title} has been requested for ${date} at ${time}.`, "info");
  // Notify doctor of new appointment request
  if (doctorId) {
    createNotification(Number(doctorId), "New Appointment Request", `Patient has requested an appointment for ${date} at ${time}.`, "warning", "appointment");
  }
  return res.status(201).json({ message: "Appointment created", appointment });
});

app.put("/api/appointments/:id", (req, res) => {
  const appointment = appointments.find((item) => Number(item.id) === Number(req.params.id));
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  const { title, type, date, time, location, status, department, doctorId, reason } = req.body || {};
  if (title) appointment.title = title;
  if (type) appointment.type = type;
  if (department) appointment.department = department;
  if (doctorId !== undefined) appointment.doctorId = doctorId;
  if (reason !== undefined) appointment.reason = reason;
  if (date) appointment.date = date;
  if (time) appointment.time = time;
  if (location) appointment.location = location;
  if (status) appointment.status = status;
  return res.json({ message: "Appointment updated", appointment });
});

app.put("/api/appointments/:id/status", (req, res) => {
  const appointment = appointments.find((item) => Number(item.id) === Number(req.params.id));
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ message: "status is required" });
  appointment.status = status;
  if (status === "scheduled" || status === "upcoming") {
    createNotification(Number(appointment.user_id), "Appointment Confirmed", `${appointment.title} is confirmed for ${appointment.date} at ${appointment.time}.`, "success");
    // Notify doctor of confirmation
    if (appointment.doctorId) {
      createNotification(Number(appointment.doctorId), "Appointment Confirmed", `You confirmed appointment for ${appointment.date} at ${appointment.time}.`, "success", "appointment");
    }
  }
  if (status === "cancelled") {
    createNotification(Number(appointment.user_id), "Appointment Cancelled", `${appointment.title} was cancelled.`, "warning");
    // Notify doctor of cancellation
    if (appointment.doctorId) {
      createNotification(Number(appointment.doctorId), "Appointment Cancelled", `Appointment for ${appointment.date} at ${appointment.time} was cancelled.`, "warning", "appointment");
    }
  }
  return res.json({ message: "Appointment updated", appointment });
});

app.get("/api/alerts/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  checkMissedMedicines();
  const items = notifications.filter((alert) => Number(alert.user_id) === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json(items);
});

app.get("/api/check-reminders/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const patient = getPatientById(userId);
  const pendingMedicines = medications.filter((medicine) => Number(medicine.user_id) === userId && String(medicine.status).toLowerCase() === "pending").length;
  const pendingTasks = recoveryTasks.filter((task) => Number(task.user_id) === userId && String(task.status).toLowerCase() === "pending").length;
  const upcomingAppointments = appointments.filter((appointment) => Number(appointment.user_id) === userId && ["upcoming", "scheduled"].includes(String(appointment.status).toLowerCase())).length;
  return res.json({
    message: "Reminders checked successfully",
    user_id: userId,
    checked_at: new Date().toISOString(),
    reminders: { medicine: pendingMedicines, recovery_tasks: pendingTasks, appointments: upcomingAppointments },
    patient: patient ? { id: patient.id, name: patient.name, role: patient.role } : null,
  });
});

app.put("/api/notifications/:id/read", (req, res) => {
  const notification = notifications.find((item) => Number(item.id) === Number(req.params.id));
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  notification.read = true;
  return res.json({ message: "Notification marked as read", notification });
});

app.delete("/api/notifications/:id", (req, res) => {
  const notificationId = Number(req.params.id);
  if (!Number.isFinite(notificationId)) {
    console.error("Invalid notification delete ID:", req.params.id);
    return res.status(400).json({ message: "Notification ID must be a valid number." });
  }
  const index = notifications.findIndex((item) => Number(item.id) === notificationId);
  if (index === -1) {
    console.error("Notification not found for deletion:", req.params.id);
    return res.status(404).json({ message: "Notification not found" });
  }
  const [notification] = notifications.splice(index, 1);
  console.log("Deleted notification:", notification.id);
  return res.json({ message: "Notification deleted", notification });
});

app.get("/api/recovery-tasks/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  return res.json({ tasks: recoveryTasks.filter((task) => Number(task.user_id) === userId).sort((a, b) => new Date(a.date || new Date()) - new Date(b.date || new Date())) });
});

app.post("/api/recovery-tasks", (req, res) => {
  const { user_id, date, name, tag, status, meta } = req.body || {};
  if (!user_id || !date || !name) return res.status(400).json({ message: "user_id, date and task name are required." });
  const task = { id: Date.now(), user_id: Number(user_id), date, name, tag: tag || "Check-in", status: status || "pending", meta: meta || "Added manually" };
  recoveryTasks.push(task);
  return res.status(201).json({ message: "Recovery task added!", task_id: task.id, task });
});

app.put("/api/recovery-tasks/:taskId", (req, res) => {
  const task = recoveryTasks.find((item) => Number(item.id) === Number(req.params.taskId));
  if (!task) return res.status(404).json({ message: "Recovery task not found" });
  const { status, meta, name } = req.body || {};
  if (status !== undefined) task.status = status;
  if (meta !== undefined) task.meta = meta;
  if (name !== undefined) task.name = name;
  return res.json({ message: "Recovery task updated", task });
});

app.delete("/api/recovery-tasks/:taskId", (req, res) => {
  const index = recoveryTasks.findIndex((task) => Number(task.id) === Number(req.params.taskId));
  if (index === -1) return res.status(404).json({ message: "Recovery task not found" });
  const [removed] = recoveryTasks.splice(index, 1);
  return res.json({ message: "Recovery task deleted", task: removed });
});

app.get("/api/daily-activities/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const activities = dailyActivities.filter((activity) => Number(activity.user_id) === userId).map((activity) => ({
    id: activity.id,
    name: activity.label || activity.type || "Activity",
    duration: activity.duration || 20,
    status: activity.completed ? "done" : "pending",
    meta: `${activity.duration || 20} ${activity.unit || "minutes"}`,
  }));
  const done = activities.filter((activity) => activity.status === "done").length;
  return res.json({ activities, completed: done, total: activities.length, percentage: activities.length ? Math.round((done / activities.length) * 100) : 0 });
});

app.put("/api/daily-activities/:activityId", (req, res) => {
  const activity = dailyActivities.find((item) => Number(item.id) === Number(req.params.activityId));
  if (!activity) return res.status(404).json({ message: "Daily activity not found" });
  const { status } = req.body || {};
  if (status) activity.completed = String(status).toLowerCase() === "done";
  return res.json({ message: "Daily activity updated", activity });
});

app.get("/api/dashboard-progress/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const range = req.query.range || "month";
  const tasks = recoveryTasks.filter((task) => Number(task.user_id) === userId);
  const completed = tasks.filter((task) => String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done").length;
  const total = tasks.length || 1;
  const overall = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
  return res.json({ overall, range, tasks: { total, completed }, activities: { total: 0, completed: 0 }, completedTasks: completed, totalTasks: total });
});

app.get("/api/doctors", (req, res) => {
  // Add ratings to doctors based on their recovery metrics
  const doctorsWithRatings = doctors.map((doctor) => {
    const doctorSummary = getOrComputeDoctorSummary(doctor.id);
    const overallRecovery = doctorSummary?.metrics?.overall || 0;
    // Convert recovery percentage to 5-star rating: 0% = 1 star, 100% = 5 stars
    const rating = Math.round((overallRecovery / 100) * 4) + 1;
    return {
      ...doctor,
      rating: Math.min(5, Math.max(1, rating)), // Ensure rating is between 1 and 5
      recoveryScore: overallRecovery // Also include raw recovery score
    };
  });
  return res.json({ doctors: doctorsWithRatings });
});

app.get("/api/doctor/:doctorId/profile", (req, res) => {
  const doctor = getDoctorById(req.params.doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  return res.json({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone || "",
    medicalRegistrationNo: doctor.medicalRegistrationNo || doctor.medical_registration_no || "",
    specialization: doctor.specialization || "",
    qualification: doctor.qualification || "",
    hospitalClinic: doctor.hospitalClinic || doctor.hospital_clinic || "",
    experience: doctor.experience || "",
    address: doctor.address || "",
    role: doctor.role || "doctor",
  });
});

app.put("/api/doctor/:doctorId/profile", (req, res) => {
  const doctor = getDoctorById(req.params.doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const { name, email, phone, medicalRegistrationNo, specialization, qualification, hospitalClinic, experience, address } = req.body || {};

  if (name !== undefined) doctor.name = name;
  if (email !== undefined) doctor.email = email;
  if (phone !== undefined) doctor.phone = phone;
  if (medicalRegistrationNo !== undefined) doctor.medicalRegistrationNo = medicalRegistrationNo;
  if (specialization !== undefined) doctor.specialization = specialization;
  if (qualification !== undefined) doctor.qualification = qualification;
  if (hospitalClinic !== undefined) doctor.hospitalClinic = hospitalClinic;
  if (experience !== undefined) doctor.experience = experience;
  if (address !== undefined) doctor.address = address;

  return res.json({ message: "Doctor profile updated", doctor: { id: doctor.id, name: doctor.name, email: doctor.email, phone: doctor.phone, medicalRegistrationNo: doctor.medicalRegistrationNo, specialization: doctor.specialization, qualification: doctor.qualification, hospitalClinic: doctor.hospitalClinic, experience: doctor.experience, address: doctor.address } });
});

app.get("/api/doctor/:doctorId/summary", (req, res) => {
  const doctor = getDoctorById(req.params.doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const patientIds = Array.isArray(doctor.patients) ? doctor.patients : [];
  const patientSummaries = patientIds
    .map((patientId) => {
      const patient = getPatientById(patientId);
      if (!patient) return null;
      const recovery = computeRecoveryMetrics(patientId);
      const patientAlerts = notifications.filter((alert) => Number(alert.user_id) === Number(patientId));
      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        email: patient.email,
        type: patient.recoveryType || "General",
        recovery,
        alerts: patientAlerts,
      };
    })
    .filter(Boolean);

  const metrics = patientSummaries.length
    ? patientSummaries.reduce(
        (acc, item) => ({
          physicalRecovery: acc.physicalRecovery + item.recovery.physicalRecovery,
          medicationRecovery: acc.medicationRecovery + item.recovery.medicationRecovery,
          dailyActivity: acc.dailyActivity + item.recovery.dailyActivity,
          overall: acc.overall + item.recovery.overall,
        }),
        { physicalRecovery: 0, medicationRecovery: 0, dailyActivity: 0, overall: 0 }
      )
    : { physicalRecovery: 0, medicationRecovery: 0, dailyActivity: 0, overall: 0 };

  const count = Math.max(patientSummaries.length, 1);
  const overallRecovery = Math.round(metrics.overall / count);
  const physicalRecovery = Math.round(metrics.physicalRecovery / count);
  const medicationRecovery = Math.round(metrics.medicationRecovery / count);
  const dailyActivity = Math.round(metrics.dailyActivity / count);

  const improvingPatients = patientSummaries.filter((patient) => patient.recovery.overall >= 70 && patient.recovery.overall < 85).length;
  const needMonitoring = patientSummaries.filter((patient) => patient.recovery.overall >= 40 && patient.recovery.overall < 70).length;
  const excellentRecovery = patientSummaries.filter((patient) => patient.recovery.overall >= 85).length;

  const totalAppointments = appointments.filter((appointment) => patientIds.includes(Number(appointment.user_id)) && ["upcoming", "scheduled", "pending"].includes(String(appointment.status).toLowerCase())).length;
  const pendingReports = notifications.filter((alert) => patientIds.includes(Number(alert.user_id)) && !alert.read).length;
  const doctorAppointments = patientIds.flatMap((patientId) => {
    const patient = getPatientById(patientId);
    return appointments
      .filter((appointment) => Number(appointment.user_id) === Number(patientId))
      .map((appointment) => ({ ...appointment, patientName: patient ? patient.name : "Unknown patient" }));
  });
  const doctorRecords = patientIds.flatMap((patientId) => {
    const patient = getPatientById(patientId);
    const latest = getLatestHealthRecord(patientId);
    return [{
      id: patientId,
      patientName: patient ? patient.name : "Unknown patient",
      title: patient ? `${patient.name} - Latest vitals` : "Latest vitals",
      subtitle: latest.has_data ? `Latest update: ${latest.recorded_at}` : "No recent vitals recorded",
      type: "Vitals",
    }];
  });

  return res.json({
    doctor: { id: doctor.id, name: doctor.name, specialization: doctor.specialization },
    overview: {
      totalPatients: patientSummaries.length,
      todaysAppointments: totalAppointments,
      averageRecovery: overallRecovery,
      pendingReports,
    },
    metrics: {
      overall: overallRecovery,
      physicalRecovery,
      medicationRecovery,
      dailyActivity,
      improvingPatients,
      needMonitoring,
      excellentRecovery,
    },
    patients: patientSummaries.map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      condition: patient.type,
      recovery: patient.recovery.overall,
      status: patient.recovery.overall >= 85 ? "Excellent" : patient.recovery.overall >= 70 ? "Improving" : patient.recovery.overall >= 40 ? "Monitoring" : "Critical",
      alerts: patient.alerts.slice(0, 3),
    })),
    appointments: doctorAppointments,
    healthRecords: doctorRecords,
  });
});

app.get("/api/doctor/:doctorId/alerts", (req, res) => {
  const doctor = getDoctorById(req.params.doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const patientIds = Array.isArray(doctor.patients) ? doctor.patients : [];
  const alerts = notifications
    .filter((alert) => Number(alert.user_id) === Number(doctor.id) || patientIds.some((patientId) => Number(alert.user_id) === Number(patientId)))
    .map((alert) => {
      const patientId = patientIds.find((id) => Number(id) === Number(alert.user_id));
      const patient = patientId ? getPatientById(patientId) : null;
      return {
        ...alert,
        patientId: patientId || null,
        patientName: patient ? patient.name : "Doctor notification",
      };
    });

  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json({ alerts });
});

app.get("/api/patient/:patientId/settings", (req, res) => {
  const patientId = Number(req.params.patientId);
  const patient = getPatientById(patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  const settings = getPatientNotificationSettings(patientId);
  return res.json({ patientId, notifications: settings, phone: patient.phone || "" });
});

app.put("/api/patient/:patientId/settings", (req, res) => {
  const patientId = Number(req.params.patientId);
  const patient = getPatientById(patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  const { notifications = {} } = req.body || {};
  const merged = savePatientNotificationSettings(patientId, notifications);
  if (!merged) return res.status(400).json({ message: "Unable to save settings" });
  return res.json({ message: "Notification preferences updated", notifications: merged });
});

app.post("/api/patient/:patientId/connect-doctor", (req, res) => {
  const patient = getPatientById(req.params.patientId);
  const { doctorId } = req.body || {};
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  const doctor = doctors.find((entry) => Number(entry.id) === Number(doctorId));
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });
  const previousDoctor = getDoctorById(patient.doctorId);
  if (previousDoctor && Array.isArray(previousDoctor.patients)) {
    previousDoctor.patients = previousDoctor.patients.filter((id) => Number(id) !== Number(patient.id));
  }
  patient.doctorId = Number(doctorId);
  const doctorUser = getDoctorById(doctorId);
  if (doctorUser) {
    doctorUser.patients = Array.isArray(doctorUser.patients) ? doctorUser.patients : [];
    if (!doctorUser.patients.some((id) => Number(id) === Number(patient.id))) {
      doctorUser.patients.push(Number(patient.id));
    }
  }
  return res.json({ message: `Connected to ${doctor.name} successfully`, doctor });
});

app.get("/api/doctor/:doctorId/patients/:patientId/overview", (req, res) => {
  const doctor = getDoctorById(req.params.doctorId);
  const patient = getPatientById(req.params.patientId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  if (!Array.isArray(doctor.patients) || !doctor.patients.some((id) => Number(id) === Number(patient.id))) {
    return res.status(403).json({ message: "This patient is not connected to the doctor." });
  }
  return res.json({
    patient: { id: patient.id, name: patient.name, email: patient.email, phone: patient.phone },
    medicines: medications.filter((medicine) => Number(medicine.user_id) === Number(patient.id)),
    healthRecords: healthRecords.filter((record) => Number(record.user_id) === Number(patient.id)),
    appointments: appointments.filter((appointment) => Number(appointment.user_id) === Number(patient.id)),
    alerts: notifications.filter((notification) => Number(notification.user_id) === Number(patient.id)),
    recovery: computeRecoveryMetrics(patient.id),
  });
});

app.get("/api/recovery-progress/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const metrics = computeRecoveryMetrics(userId);
  return res.json({ physicalRecovery: metrics.physicalRecovery, medicationRecovery: metrics.medicationRecovery, dailyActivity: metrics.dailyActivity, overall: metrics.overall, tasks: { total: metrics.tasks.total, completed: metrics.tasks.completed }, activities: { total: metrics.activities.total, completed: metrics.activities.completed }, overallPercentage: metrics.overall });
});

app.get("/api/dashboard/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  const latest = getLatestHealthRecord(userId);
  const recovery = computeRecoveryMetrics(userId);
  const summary = getPersonalizedAiSummary(userId);
  const pendingMedicines = medications.filter((medicine) => Number(medicine.user_id) === userId && String(medicine.status).toLowerCase() === "pending");
  const upcomingAppointments = appointments.filter((appointment) => Number(appointment.user_id) === userId && String(appointment.status).toLowerCase() !== "completed");
  return res.json({ latest, recovery, summary, pendingMedicines: pendingMedicines.length, upcomingAppointments: upcomingAppointments.length, unreadAlerts: notifications.filter((alert) => Number(alert.user_id) === userId && !alert.read).length });
});

app.get("/api/doctor/:doctorId/patients", (req, res) => {
  const doctor = getDoctorById(req.params.doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const patientList = users
    .filter((user) => user.role === "patient" && (doctor.patients || []).includes(user.id))
    .map((patient) => {
      const recovery = computeRecoveryMetrics(patient.id);
      const status = recovery.overall >= 85 ? "Excellent" : recovery.overall >= 70 ? "Improving" : recovery.overall >= 40 ? "Monitoring" : "Critical";
      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        recovery_type: patient.recoveryType,
        email: patient.email,
        recovery: recovery.overall,
        status,
      };
    });

  return res.json({ patients: patientList });
});

app.get("/api/doctor/:doctorId/patient-vitals/:patientId", (req, res) => {
  const patient = getPatientById(req.params.patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found" });
  const latest = getLatestHealthRecord(patient.id);
  const vitalEntries = [{ date: new Date().toISOString(), blood_sugar: latest.blood_sugar?.value || null, heart_rate: latest.heart_rate?.value || null, systolic: latest.blood_pressure?.value?.systolic || null, diastolic: latest.blood_pressure?.value?.diastolic || null, hemoglobin: latest.hemoglobin?.value || null, status: latest.has_data ? "stable" : "no-data" }];
  return res.json({ patient: patient.name, recovery_type: patient.recoveryType, vitals: vitalEntries });
});

const PORT = Number(process.env.PORT) || 5001;
app.listen(PORT, () => {
  checkMissedMedicines();
  setInterval(checkMissedMedicines, 60 * 1000);
  console.log(`Server running on http://localhost:${PORT}`);
});
