import os
import re
import random
from datetime import datetime, date, timedelta

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sqlalchemy import text

from models import (
    db,
    User,
    HealthRecord,
    UserSettings,
    RecoveryTask,
    DailyActivity,
    RecoveryPhoto,
    Medicine,
    Appointment,
    Alert,
    Document,
    DoctorPatient,
    HealthRecordFile,
    PatientMedicine,
    DailyCheckin,
    RecoveryPlan,
    RecoveryPlanActivity,
    RecoveryPlanGoal,
    HealthScoreSnapshot,
    GamificationState,
    Badge,
    Message,
    RecoveryMilestone,
    HealthJournal,
    MedicineInteractionRule,
    WearableSimulator,
    WearableReading,
)
from medicine_ocr import extract_medicine_info, lookup_medicine_purpose

app = Flask(__name__)
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(BACKEND_DIR, "instance"), exist_ok=True)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(BACKEND_DIR, "instance", "healtrack.db").replace("\\", "/")
db.init_app(app)

CORS(app, origins="*")


@app.after_request
def ensure_cors_headers(response):
    """Ensure every response carries CORS headers, including error responses
    that bypass Flask-CORS normal handling.

    Preflight OPTIONS requests are left untouched so Flask-CORS can emit its
    full set of headers (Access-Control-Allow-{Methods,Headers}); stamping
    Access-Control-Allow-Origin here first makes Flask-CORS skip that request
    (it bails out when the header is already present)."""
    if request.method == "OPTIONS" and request.headers.get("Access-Control-Request-Method"):
        return response
    if "Access-Control-Allow-Origin" not in response.headers:
        origin = request.headers.get("Origin")
        response.headers["Access-Control-Allow-Origin"] = origin or "*"
        response.headers["Vary"] = "Origin"
    return response


# =====================================================
# LIGHTWEIGHT SCHEMA MIGRATION (sqlite ALTER TABLE)
# =====================================================

# (table_name, column_name, column_type) added when missing.
# Only nullable columns with safe defaults are allowed -- sqlite cannot
# add a NOT NULL column to a non-empty table without a constant default.
NEW_COLUMNS = [
    ("medicine", "dosage", "VARCHAR(50) DEFAULT ''"),
    ("medicine", "frequency", "VARCHAR(50) DEFAULT 'Once daily'"),
    ("medicine", "timing", "VARCHAR(50) DEFAULT 'morning'"),
    ("medicine", "expiry_date", "VARCHAR(10)"),
    ("alert", "is_read", "BOOLEAN DEFAULT 0"),
    ("appointment", "doctor_id", "INTEGER"),
    ("appointment", "department", "VARCHAR(50)"),
    ("appointment", "reason", "TEXT"),
    ("alert", "source", "VARCHAR(30) DEFAULT 'system'"),
]


def migrate_schema():
    """Add missing columns to existing sqlite tables (kept idempotent)."""
    with app.app_context():
        for table, column, column_type in NEW_COLUMNS:
            try:
                rows = db.session.execute(
                    text(f'PRAGMA table_info("{table}")')
                ).fetchall()
                existing = {row[1] for row in rows}
            except Exception:
                continue

            if column not in existing:
                try:
                    db.session.execute(
                        text(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {column_type}')
                    )
                    db.session.commit()
                    print(f"[migrate] Added {table}.{column}")
                except Exception as exc:
                    db.session.rollback()
                    print(f"[migrate] Could not add {table}.{column}: {exc}")


# =====================================================
# UPLOAD FOLDERS
# =====================================================

UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads", "recovery_photos")
HEALTH_RECORDS_UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads", "health_records")
MEDICINE_UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads", "medicines")

os.makedirs(MEDICINE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(HEALTH_RECORDS_UPLOAD_FOLDER, exist_ok=True)

ALLOWED_HEALTH_RECORD_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
        os.path.splitext(filename)[1].lower() in ALLOWED_HEALTH_RECORD_EXTENSIONS


# =====================================================
# HEALTH RECORD NORMAL RANGES / STATUS HELPER
# =====================================================

NORMAL_RANGES = {
    "blood_sugar": (70, 140),      # mg/dL
    "heart_rate": (60, 100),       # BPM
    "systolic": (90, 120),         # mmHg
    "diastolic": (60, 80),         # mmHg
    "hemoglobin": (12, 16),        # g/dL
}


def get_status(field, value):
    """Value ko normal range ke against check karke status deta hai."""
    if value is None:
        return None
    if field not in NORMAL_RANGES:
        return "normal"
    low, high = NORMAL_RANGES[field]
    if value < low:
        return "low"
    if value > high:
        return "high"
    return "normal"


# =====================================================
# ALERT HELPERS
# =====================================================

def create_alert_if_not_exists(user_id, alert_type, title, message, source="system"):
    """Same din me duplicate alert dobara nahi banega.
    `source` scopes the daily-dedupe so e.g. the wearable simulator's
    abnormal-vitals alerts stay independent from system alerts."""
    today_start = datetime.combine(date.today(), datetime.min.time())

    existing = Alert.query.filter(
        Alert.user_id == user_id,
        Alert.title == title,
        Alert.source == source,
        Alert.created_at >= today_start
    ).first()

    if existing:
        return

    alert = Alert(
        user_id=user_id,
        type=alert_type,
        title=title,
        message=message,
        source=source
    )
    db.session.add(alert)
    db.session.commit()


def create_alert(user_id, alert_type, title, message, source="system"):
    """Backwards-compatible alias (kept because other routes call this name)."""
    create_alert_if_not_exists(user_id, alert_type, title, message, source)


def compute_expiry_status(expiry_date):
    """Return 'Expired', 'Expiring Soon' or 'Active' from an ISO expiry date."""
    if not expiry_date:
        return "Active"

    value = str(expiry_date).strip()
    try:
        if len(value) == 7:
            value += "-01"
        exp = datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return "Active"

    days_left = (exp - date.today()).days
    if days_left < 0:
        return "Expired"
    if days_left <= 30:
        return "Expiring Soon"
    return "Active"


def check_bmi_alert(patient):
    if not patient.height or not patient.weight:
        return

    height_m = patient.height / 100
    bmi = round(patient.weight / (height_m * height_m), 1)

    if bmi < 18.5:
        create_alert_if_not_exists(
            patient.id, "warning", "BMI Low",
            f"Your BMI is {bmi}, which is underweight. Consider consulting your doctor."
        )
    elif bmi >= 30:
        create_alert_if_not_exists(
            patient.id, "warning", "BMI High",
            f"Your BMI is {bmi}, which falls in the obese range. Consider consulting your doctor."
        )
    elif bmi >= 25:
        create_alert_if_not_exists(
            patient.id, "warning", "BMI High",
            f"Your BMI is {bmi}, which is overweight. Consider consulting your doctor."
        )


# =====================================================
# HOME
# =====================================================

@app.route("/")
def home():
    return {"message": "HealTrack backend is running! 🚀"}


# =====================================================
# RECOVERY TASKS
# =====================================================

@app.route("/api/recovery-tasks/<int:user_id>", methods=["GET"])
def get_recovery_tasks(user_id):
    tasks = (
        RecoveryTask.query
        .filter_by(user_id=user_id)
        .order_by(RecoveryTask.date.asc())
        .all()
    )
    return jsonify({
        "tasks": [
            {
                "id": t.id,
                "date": t.date.isoformat(),
                "name": t.name,
                "tag": t.tag,
                "status": t.status,
                "meta": t.meta
            }
            for t in tasks
        ]
    })




@app.route("/api/recovery-tasks", methods=["POST"])
def add_recovery_task():
    data = request.get_json()
    task = RecoveryTask(
        user_id=data["user_id"],
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        name=data["name"],
        tag=data.get("tag"),
        status=data.get("status", "pending"),
        meta=data.get("meta")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Recovery task added successfully", "id": task.id}), 201


@app.route("/api/recovery-tasks/<int:task_id>", methods=["PUT"])
def update_recovery_task(task_id):
    task = RecoveryTask.query.get_or_404(task_id)
    data = request.get_json()

    if "status" in data:
        task.status = data["status"]
    if "meta" in data:
        task.meta = data["meta"]
    if "name" in data:
        task.name = data["name"]

    db.session.commit()
    return jsonify({"message": "Recovery task updated successfully"})


@app.route("/api/recovery-tasks/<int:task_id>", methods=["DELETE"])
def delete_recovery_task(task_id):
    task = RecoveryTask.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Recovery task deleted successfully"})


# =====================================================
# RECOVERY PROGRESS
# =====================================================

@app.route("/api/recovery-progress/<int:user_id>", methods=["GET"])
def get_recovery_progress(user_id):
    today = date.today()
    all_tasks = RecoveryTask.query.filter_by(user_id=user_id).all()

    def summarize(tasks_list):
        if not tasks_list:
            return {
                "total_tasks": 0,
                "completed_tasks": 0,
                "completion_percent": 0,
                "tag_breakdown": {}
            }

        total = len(tasks_list)
        done = len([t for t in tasks_list if t.status == "done"])
        percent = round((done / total) * 100, 1)

        tag_breakdown = {}
        for task in tasks_list:
            tag = task.tag or "Other"
            if tag not in tag_breakdown:
                tag_breakdown[tag] = {"total": 0, "done": 0}
            tag_breakdown[tag]["total"] += 1
            if task.status == "done":
                tag_breakdown[tag]["done"] += 1

        for tag in tag_breakdown:
            total_tag = tag_breakdown[tag]["total"]
            done_tag = tag_breakdown[tag]["done"]
            tag_breakdown[tag]["percent"] = round((done_tag / total_tag) * 100, 1)

        return {
            "total_tasks": total,
            "completed_tasks": done,
            "completion_percent": percent,
            "tag_breakdown": tag_breakdown
        }

    today_tasks = [t for t in all_tasks if t.date == today]
    month_tasks = [t for t in all_tasks if t.date.year == today.year and t.date.month == today.month]

    today_summary = summarize(today_tasks)
    month_summary = summarize(month_tasks)

    weekly_progress = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_tasks = [t for t in all_tasks if t.date == d]
        if day_tasks:
            done = len([t for t in day_tasks if t.status == "done"])
            percent = round((done / len(day_tasks)) * 100, 1)
        else:
            percent = 0
        weekly_progress.append({
            "date": d.isoformat(),
            "day": d.strftime("%a")[0],
            "percent": percent
        })

    tasks_by_date = {}
    for task in all_tasks:
        tasks_by_date.setdefault(task.date, []).append(task)

    streak = 0
    cursor = today
    while cursor in tasks_by_date:
        group = tasks_by_date[cursor]
        if all(task.status == "done" for task in group):
            streak += 1
            cursor -= timedelta(days=1)
        else:
            break

    return jsonify({
        "today": today_summary,
        "month": month_summary,
        "weekly_progress": weekly_progress,
        "current_streak": streak
    })


# =====================================================
# DAILY ACTIVITY
# =====================================================

@app.route("/api/daily-activities/<int:user_id>", methods=["GET"])
def get_daily_activities(user_id):
    today = date.today()
    activities = DailyActivity.query.filter_by(user_id=user_id, date=today).all()

    total = len(activities)
    completed = len([a for a in activities if a.status == "done"])
    percentage = round((completed / total) * 100, 1) if total > 0 else 0

    result = [
        {
            "id": a.id,
            "name": a.name,
            "duration": a.duration,
            "status": a.status,
            "meta": a.meta
        }
        for a in activities
    ]

    return jsonify({
        "activities": result,
        "percentage": percentage,
        "completed": completed,
        "total": total
    })


@app.route("/api/daily-activities/<int:activity_id>", methods=["PUT"])
def update_daily_activity(activity_id):
    activity = DailyActivity.query.get_or_404(activity_id)
    data = request.get_json()

    if "status" in data:
        activity.status = data["status"]
    if "meta" in data:
        activity.meta = data["meta"]

    db.session.commit()
    return jsonify({"message": "Daily activity updated successfully"})


@app.route("/api/daily-activities", methods=["POST"])
def add_daily_activity():
    data = request.get_json()
    activity = DailyActivity(
        user_id=data["user_id"],
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        name=data["name"],
        duration=data.get("duration", 0),
        status=data.get("status", "pending"),
        meta=data.get("meta")
    )
    db.session.add(activity)
    db.session.commit()
    return jsonify({"message": "Daily activity added successfully", "id": activity.id}), 201


# =====================================================
# DASHBOARD PROGRESS
# =====================================================

@app.route("/api/dashboard-progress/<int:user_id>", methods=["GET"])
def get_dashboard_progress(user_id):
    selected_range = request.args.get("range", "month")
    today = date.today()

    if selected_range == "week":
        start_date = today - timedelta(days=6)
        end_date = today
    elif selected_range == "last-week":
        current_week_start = today - timedelta(days=today.weekday())
        start_date = current_week_start - timedelta(days=7)
        end_date = current_week_start - timedelta(days=1)
    elif selected_range == "last-month":
        first_day_current_month = date(today.year, today.month, 1)
        last_day_previous_month = first_day_current_month - timedelta(days=1)
        start_date = date(last_day_previous_month.year, last_day_previous_month.month, 1)
        end_date = last_day_previous_month
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    recovery_tasks = RecoveryTask.query.filter(
        RecoveryTask.user_id == user_id,
        RecoveryTask.date >= start_date,
        RecoveryTask.date <= end_date
    ).all()

    daily_activities = DailyActivity.query.filter(
        DailyActivity.user_id == user_id,
        DailyActivity.date >= start_date,
        DailyActivity.date <= end_date
    ).all()

    physical_tasks = [
        t for t in recovery_tasks
        if t.tag and t.tag.lower() in ["physical recovery", "physical", "exercise"]
    ]

    if physical_tasks:
        physical_done = len([t for t in physical_tasks if t.status == "done"])
        physical_recovery = round((physical_done / len(physical_tasks)) * 100, 1)
    elif recovery_tasks:
        done = len([t for t in recovery_tasks if t.status == "done"])
        physical_recovery = round((done / len(recovery_tasks)) * 100, 1)
    else:
        physical_recovery = 0

    medicines = Medicine.query.filter(
        Medicine.user_id == user_id,
        Medicine.date >= start_date,
        Medicine.date <= end_date
    ).all()

    if medicines:
        medicine_done = len([m for m in medicines if str(m.status).lower() in ["taken", "done", "completed"]])
        medication = round((medicine_done / len(medicines)) * 100, 1)
    else:
        medication = 0

    if daily_activities:
        activity_done = len([a for a in daily_activities if a.status == "done"])
        daily_activity = round((activity_done / len(daily_activities)) * 100, 1)
    else:
        daily_activity = 0

    values = [physical_recovery, medication, daily_activity]
    available_values = [v for v in values if v > 0]
    overall = round(sum(available_values) / len(available_values), 1) if available_values else 0

    graph = []
    current = start_date
    while current <= end_date:
        day_recovery_tasks = [t for t in recovery_tasks if t.date == current]
        day_activity_tasks = [a for a in daily_activities if a.date == current]

        if day_recovery_tasks:
            done_recovery = len([t for t in day_recovery_tasks if t.status == "done"])
            recovery_percent = round((done_recovery / len(day_recovery_tasks)) * 100, 1)
        else:
            recovery_percent = 0

        if day_activity_tasks:
            done_activity = len([a for a in day_activity_tasks if a.status == "done"])
            activity_percent = round((done_activity / len(day_activity_tasks)) * 100, 1)
        else:
            activity_percent = 0

        graph.append({
            "date": current.isoformat(),
            "day": current.strftime("%d %b"),
            "recovery": recovery_percent,
            "daily_activity": activity_percent
        })
        current += timedelta(days=1)

    return jsonify({
        "range": selected_range,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "overall": overall,
        "physical_recovery": physical_recovery,
        "medication": medication,
        "daily_activity": daily_activity,
        "graph": graph
    })


# =====================================================
# AUTH / REGISTER
# =====================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"message": "Email already exists"}), 400

    new_user = User(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        password=data.get("password"),
        role=data.get("role")
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Registration successful!"}), 201


@app.route("/api/register/patient", methods=["POST"])
def register_patient():
    data = request.get_json()

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

    user = User(
        name=data["fullName"],
        email=data["email"],
        phone=data["phone"],
        password=data["password"],
        role="patient",
        dob=data.get("dob"),
        age=data.get("age"),
        gender=data.get("gender"),
        recovery_type=data.get("recoveryType"),
        emergency_contact=data.get("emergencyContact"),
        language="English",
        notify_medicine=True,
        notify_appointment=True,
        notify_email=True
    )
    db.session.add(user)
    db.session.commit()

    # Create default settings
    settings = UserSettings(user_id=user.id)
    db.session.add(settings)
    db.session.commit()

    return jsonify({"message": "Patient registered successfully!", "user_id": user.id}), 201


@app.route("/api/register/doctor", methods=["POST"])
def register_doctor():
    data = request.get_json()

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

    user = User(
        name=data["fullName"],
        email=data["email"],
        phone=data["phone"],
        password=data["password"],
        role="doctor",
        medical_registration_no=data.get("medicalRegistrationNo"),
        specialization=data.get("specialization"),
        qualification=data.get("qualification"),
        hospital_clinic=data.get("hospitalClinic"),
        experience=data.get("experience"),
        address=data.get("address")
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Doctor registered successfully!", "user_id": user.id}), 201


@app.route("/api/register/caretaker", methods=["POST"])
def register_caretaker():
    data = request.get_json()

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

    user = User(
        name=data["fullName"],
        email=data["email"],
        phone=data["phone"],
        password=data["password"],
        role="caretaker",
        relationship=data.get("relationship"),
        patient_id=data.get("patientId")
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Caretaker registered successfully!", "user_id": user.id}), 201


# =====================================================
# LOGIN
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    user = User.query.filter_by(email=email, role=role).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.password != password:
        return jsonify({"message": "Wrong password"}), 401

    return jsonify({
        "message": "Login successful!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# =====================================================
# DOCTOR PROFILE
# =====================================================

@app.route("/api/doctor/profile/<int:doctor_id>", methods=["GET"])
def get_doctor_profile(doctor_id):
    doctor = User.query.filter_by(id=doctor_id, role="doctor").first()
    if not doctor:
        return jsonify({"message": "Doctor not found"}), 404

    return jsonify({
        "id": doctor.id,
        "name": doctor.name,
        "email": doctor.email,
        "phone": doctor.phone,
        "medicalRegistrationNo": doctor.medical_registration_no,
        "specialization": doctor.specialization,
        "qualification": doctor.qualification,
        "hospitalClinic": doctor.hospital_clinic,
        "experience": doctor.experience,
        "address": doctor.address
    }), 200


@app.route("/api/doctor/profile/<int:doctor_id>", methods=["PUT"])
def update_doctor_profile(doctor_id):
    doctor = User.query.filter_by(id=doctor_id, role="doctor").first()
    if not doctor:
        return jsonify({"message": "Doctor not found"}), 404

    data = request.get_json()
    doctor.name = data.get("name", doctor.name)
    doctor.email = data.get("email", doctor.email)
    doctor.phone = data.get("phone", doctor.phone)
    doctor.medical_registration_no = data.get("medicalRegistrationNo", doctor.medical_registration_no)
    doctor.specialization = data.get("specialization", doctor.specialization)
    doctor.qualification = data.get("qualification", doctor.qualification)
    doctor.hospital_clinic = data.get("hospitalClinic", doctor.hospital_clinic)
    doctor.experience = data.get("experience", doctor.experience)
    doctor.address = data.get("address", doctor.address)

    db.session.commit()
    return jsonify({"message": "Doctor profile updated successfully!"}), 200


@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    doctors = User.query.filter_by(role="doctor").all()
    return jsonify({
        "doctors": [
            {
                "id": d.id,
                "name": d.name,
                "specialization": d.specialization or "General",
                "hospitalClinic": d.hospital_clinic or "Hospital",
                "experience": d.experience or "5+ years",
                "email": d.email,
                "phone": d.phone
            }
            for d in doctors
        ]
    }), 200


@app.route("/api/patient/<int:patient_id>/connect-doctor", methods=["POST"])
def connect_doctor(patient_id):
    data = request.get_json()
    doctor_id = data.get("doctorId")

    patient = User.query.get_or_404(patient_id)
    doctor = User.query.get_or_404(doctor_id)

    if doctor.role != "doctor":
        return jsonify({"message": "Invalid doctor ID"}), 400

    existing = DoctorPatient.query.filter_by(doctor_id=doctor_id, patient_id=patient_id).first()
    if existing:
        return jsonify({"message": "Already connected with this doctor"}), 200

    connection = DoctorPatient(doctor_id=doctor_id, patient_id=patient_id)
    db.session.add(connection)
    db.session.commit()

    create_alert(
        patient_id, "success", "Doctor Connected",
        f"You have connected with Dr. {doctor.name} ({doctor.specialization})"
    )

    return jsonify({
        "message": f"Connected successfully with Dr. {doctor.name}",
        "doctor": {"id": doctor.id, "name": doctor.name, "specialization": doctor.specialization}
    }), 201


@app.route("/api/doctor/<int:doctor_id>/patients", methods=["GET"])
def get_doctor_patients(doctor_id):
    """Get list of patients assigned to a doctor"""
    doctor = User.query.get_or_404(doctor_id)
    if doctor.role != "doctor":
        return jsonify({"message": "Only doctors can access this"}), 403

    connection_ids = [c.patient_id for c in DoctorPatient.query.filter_by(doctor_id=doctor_id).all()]

    if connection_ids:
        patients = User.query.filter(User.id.in_(connection_ids)).all()
    else:
        patients = User.query.filter_by(role="patient").all()

    return jsonify({
        "patients": [
            {
                "id": p.id,
                "name": p.name,
                "email": p.email,
                "age": p.age,
                "gender": p.gender,
                "recovery_type": p.recovery_type,
                "phone": p.phone,
                "blood_group": p.blood_group,
                "emergency_contact": p.emergency_contact,
            }
            for p in patients
        ]
    }), 200


@app.route("/api/doctor/<int:doctor_id>/patient-vitals/<int:patient_id>", methods=["GET"])
def get_patient_vitals_for_doctor(doctor_id, patient_id):
    """Doctor views patient's vitals"""
    doctor = User.query.get_or_404(doctor_id)
    if doctor.role != "doctor":
        return jsonify({"message": "Only doctors can access this"}), 403

    patient = User.query.get_or_404(patient_id)

    if patient.role == "patient" and not DoctorPatient.query.filter_by(
        doctor_id=doctor_id, patient_id=patient_id
    ).first():
        db.session.add(DoctorPatient(doctor_id=doctor_id, patient_id=patient_id))
        db.session.commit()

    records = (
        HealthRecord.query
        .filter_by(user_id=patient_id)
        .order_by(HealthRecord.recorded_at.desc())
        .limit(10)
        .all()
    )

    caretaker = User.query.filter_by(role="caretaker", patient_id=patient_id).first()

    return jsonify({
        "patient": patient.name,
        "recovery_type": patient.recovery_type,
        "caretaker": caretaker.name if caretaker else "N/A",
        "vitals": [
            {
                "blood_sugar": r.blood_sugar,
                "heart_rate": r.heart_rate,
                "systolic": r.systolic,
                "diastolic": r.diastolic,
                "hemoglobin": r.hemoglobin,
                "recorded_at": r.recorded_at.isoformat(),
                "blood_sugar_status": get_status("blood_sugar", r.blood_sugar),
                "heart_rate_status": get_status("heart_rate", r.heart_rate)
            }
            for r in records
        ]
    }), 200


@app.route("/api/caretaker/<int:caretaker_id>/patient", methods=["GET"])
def get_caretaker_patient(caretaker_id):
    caretaker = User.query.get_or_404(caretaker_id)
    if caretaker.role != "caretaker":
        return jsonify({"message": "Only caretakers can access this"}), 403

    patient = None
    if caretaker.patient_id:
        patient = User.query.get(caretaker.patient_id)
    if not patient:
        patient = User.query.filter_by(role="patient").order_by(User.id.asc()).first()

    doctor = None
    if patient:
        connection = (
            DoctorPatient.query
            .filter_by(patient_id=patient.id)
            .order_by(DoctorPatient.connected_at.desc())
            .first()
        )
        if connection:
            doctor = User.query.get(connection.doctor_id)

    return jsonify({
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "recovery_type": patient.recovery_type,
            "phone": patient.phone,
            "email": patient.email,
        } if patient else None,
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "hospital_clinic": doctor.hospital_clinic,
            "email": doctor.email,
        } if doctor else None,
    }), 200


@app.route("/api/users")
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users])


@app.route("/db-path")
def db_path():
    return {"current_directory": os.getcwd()}


# =====================================================
# HEALTH RECORDS (VITALS)
# =====================================================

@app.route("/api/health-record", methods=["POST"])
def add_health_record():
    data = request.get_json()

    record = HealthRecord(
        user_id=data.get("user_id"),
        blood_sugar=data.get("blood_sugar"),
        heart_rate=data.get("heart_rate"),
        systolic=data.get("systolic"),
        diastolic=data.get("diastolic"),
        hemoglobin=data.get("hemoglobin")
    )
    db.session.add(record)
    db.session.commit()

    field_labels = {
        "blood_sugar": ("Blood Sugar", "mg/dL"),
        "heart_rate": ("Heart Rate", "BPM"),
        "systolic": ("Blood Pressure (Systolic)", "mmHg"),
        "diastolic": ("Blood Pressure (Diastolic)", "mmHg"),
        "hemoglobin": ("Hemoglobin", "g/dL"),
    }

    for field, (label, unit) in field_labels.items():
        value = getattr(record, field)
        status = get_status(field, value)
        if status in ("high", "low"):
            create_alert_if_not_exists(
                record.user_id, "warning", f"{label} {status.capitalize()}",
                f"Your last {label} reading was {value} {unit}, which is {status}. Please consult your doctor."
            )

    return jsonify({"message": "Health record added successfully!", "record_id": record.id}), 201


@app.route("/api/health-record/<int:user_id>", methods=["GET"])
def get_health_records(user_id):
    records = (
        HealthRecord.query
        .filter_by(user_id=user_id)
        .order_by(HealthRecord.recorded_at.desc())
        .all()
    )

    return jsonify([
        {
            "id": r.id,
            "user_id": r.user_id,
            "blood_sugar": r.blood_sugar,
            "heart_rate": r.heart_rate,
            "systolic": r.systolic,
            "diastolic": r.diastolic,
            "hemoglobin": r.hemoglobin,
            "recorded_at": r.recorded_at.strftime("%d %b %Y, %I:%M %p") if r.recorded_at else None
        }
        for r in records
    ]), 200


@app.route("/api/health-record/<int:user_id>/latest", methods=["GET"])
def get_latest_health_record(user_id):
    """Health Overview page ke liye — latest reading, status ke saath."""
    record = (
        HealthRecord.query
        .filter_by(user_id=user_id)
        .order_by(HealthRecord.recorded_at.desc())
        .first()
    )

    if not record:
        return jsonify({
            "has_data": False,
            "blood_sugar": None,
            "heart_rate": None,
            "blood_pressure": None,
            "hemoglobin": None,
        }), 200

    return jsonify({
        "has_data": True,
        "recorded_at": record.recorded_at.strftime("%d %b %Y, %I:%M %p") if record.recorded_at else None,
        "blood_sugar": {
            "value": record.blood_sugar, "unit": "mg/dL",
            "status": get_status("blood_sugar", record.blood_sugar)
        },
        "heart_rate": {
            "value": record.heart_rate, "unit": "BPM",
            "status": get_status("heart_rate", record.heart_rate)
        },
        "blood_pressure": {
            "systolic": record.systolic, "diastolic": record.diastolic, "unit": "mmHg",
            "status": get_status("systolic", record.systolic) if record.systolic else None
        },
        "hemoglobin": {
            "value": record.hemoglobin, "unit": "g/dL",
            "status": get_status("hemoglobin", record.hemoglobin)
        },
    }), 200


@app.route("/api/ai-analysis/<int:user_id>", methods=["GET"])
def get_ai_analysis(user_id):
    latest_record = HealthRecord.query.filter_by(user_id=user_id).order_by(
        HealthRecord.recorded_at.desc()
    ).first()

    all_tasks = RecoveryTask.query.filter_by(user_id=user_id).all()
    done_tasks = sum(1 for task in all_tasks if str(task.status).lower() == "done")
    pending_medicines = Medicine.query.filter_by(user_id=user_id).filter(
        Medicine.status != "taken"
    ).count()

    health_status = "Good"
    summary = "Your recent health parameters are within the normal range."
    recommendation = "Continue your current recovery plan and regular checkups."
    insight = "Your recovery is progressing well."

    if latest_record:
        vitals = {
            "blood_sugar": get_status("blood_sugar", latest_record.blood_sugar),
            "heart_rate": get_status("heart_rate", latest_record.heart_rate),
            "systolic": get_status("systolic", latest_record.systolic),
            "diastolic": get_status("diastolic", latest_record.diastolic),
            "hemoglobin": get_status("hemoglobin", latest_record.hemoglobin),
        }

        if any(v not in (None, "normal") for v in vitals.values()):
            health_status = "Needs attention"
            summary = "A few recent readings are outside the normal range and should be reviewed."
            insight = "Monitor the highlighted readings and follow up with your care team if symptoms continue."
            recommendation = "Review your vitals, stay on schedule with medications, and consult your physician if trends persist."

    if pending_medicines > 0:
        health_status = "Needs attention" if health_status == "Good" else health_status
        recommendation = "You have pending medications. Stay consistent with your schedule to improve recovery."

    score = 90
    if health_status != "Good":
        score = max(55, 90 - pending_medicines * 10 - (len(all_tasks) - done_tasks) * 3)

    return jsonify({
        "status": health_status,
        "health_score": int(score),
        "summary": summary,
        "insight": insight,
        "recommendation": recommendation,
        "metrics": {
            "blood_sugar": latest_record.blood_sugar if latest_record else None,
            "heart_rate": latest_record.heart_rate if latest_record else None,
            "systolic": latest_record.systolic if latest_record else None,
            "diastolic": latest_record.diastolic if latest_record else None,
            "hemoglobin": latest_record.hemoglobin if latest_record else None,
        },
        "tasks_completed": done_tasks,
        "pending_medicines": pending_medicines,
    }), 200


# =====================================================
# HEALTH RECORDS — FILE ATTACHMENTS
# =====================================================

@app.route("/api/health-records/<int:user_id>/files", methods=["GET"])
def get_health_record_files(user_id):
    """Get all attached files for a patient's health records."""
    files = (
        HealthRecordFile.query
        .filter_by(user_id=user_id)
        .order_by(HealthRecordFile.uploaded_at.desc())
        .all()
    )

    return jsonify([
        {
            "id": f.id,
            "record_type": f.record_type,
            "filename": f.filename,
            "file_type": f.file_type,
            "file_size": f.file_size,
            "url": f"/api/health-records/files/{f.id}/download",
            "uploaded_at": f.uploaded_at.strftime("%d %b %Y, %I:%M %p") if f.uploaded_at else None
        }
        for f in files
    ]), 200


@app.route("/api/health-records/files/<int:user_id>/<record_type>", methods=["POST"])
def upload_health_record_file(user_id, record_type):
    """Upload a file (PDF/Image) for a health record."""
    if 'file' not in request.files:
        return jsonify({"message": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"message": "File type not allowed. Allowed: PDF, JPG, JPEG, PNG"}), 400

    file_ext = os.path.splitext(file.filename)[1].lower()
    filename = (
        f"{user_id}_{record_type.replace(' ', '_')}_"
        f"{datetime.now().strftime('%Y%m%d%H%M%S')}{file_ext}"
    )
    filepath = os.path.join(HEALTH_RECORDS_UPLOAD_FOLDER, filename)
    file.save(filepath)

    file_size_bytes = os.path.getsize(filepath)
    if file_size_bytes < 1024:
        file_size = f"{file_size_bytes} B"
    elif file_size_bytes < 1024 * 1024:
        file_size = f"{round(file_size_bytes / 1024, 1)} KB"
    else:
        file_size = f"{round(file_size_bytes / (1024 * 1024), 1)} MB"

    record_file = HealthRecordFile(
        user_id=user_id,
        record_type=record_type,
        filename=filename,
        file_path=filepath,
        file_size=file_size,
        file_type=file_ext.lstrip('.')
    )
    db.session.add(record_file)
    db.session.commit()

    return jsonify({
        "message": "File uploaded successfully",
        "id": record_file.id,
        "filename": filename,
        "file_size": file_size,
        "url": f"/api/health-records/files/{record_file.id}/download"
    }), 201


@app.route("/api/health-records/files/<int:file_id>/download", methods=["GET"])
def download_health_record_file(file_id):
    """Download/view an uploaded health record file."""
    record_file = HealthRecordFile.query.get_or_404(file_id)
    if not os.path.exists(record_file.file_path):
        return jsonify({"message": "File not found"}), 404
    return send_from_directory(HEALTH_RECORDS_UPLOAD_FOLDER, record_file.filename)


@app.route("/api/health-records/files/<int:file_id>", methods=["DELETE"])
def delete_health_record_file(file_id):
    """Delete an attached health record file."""
    record_file = HealthRecordFile.query.get_or_404(file_id)
    if os.path.exists(record_file.file_path):
        os.remove(record_file.file_path)
    db.session.delete(record_file)
    db.session.commit()
    return jsonify({"message": "File deleted successfully"}), 200


# =====================================================
# DOCUMENTS
# =====================================================

@app.route("/api/documents/<int:user_id>", methods=["GET"])
def get_documents(user_id):
    documents = (
        Document.query
        .filter_by(user_id=user_id)
        .order_by(Document.created_at.desc(), Document.id.desc())
        .all()
    )

    payload = [
        {
            "id": d.id,
            "title": d.title,
            "record_type": d.record_type or "Report",
            "type": d.record_type or "Report",
            "file_size": d.file_size or "N/A",
            "size": d.file_size or "N/A",
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "date": d.created_at.strftime("%d %b %Y") if d.created_at else None,
        }
        for d in documents
    ]

    return jsonify({"documents": payload, "records": payload}), 200


@app.route("/api/health-records/<int:user_id>", methods=["GET"])
def get_health_records_list(user_id):
    """Alias kept for older frontend calls that hit this path."""
    return get_documents(user_id)


@app.route("/api/documents", methods=["POST"])
def add_document():
    data = request.get_json()
    doc = Document(
        user_id=data["user_id"],
        title=data["title"],
        record_type=data.get("record_type"),
        file_path=data.get("file_path"),
        file_size=data.get("file_size")
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({"message": "Document added", "id": doc.id}), 201


@app.route("/api/records/<int:user_id>/types", methods=["GET"])
def get_records_types(user_id):
    """Group documents by record type for the HealthRecords page."""
    RECORD_TYPES = ["Lab Report", "Prescription", "Discharge Summary", "Scan Report", "Clinical Notes"]

    documents = Document.query.filter_by(user_id=user_id).all()

    categories = []
    for record_type in RECORD_TYPES:
        docs_for_type = [
            {
                "id": d.id,
                "title": d.title,
                "record_type": d.record_type or record_type,
                "file_size": d.file_size or "N/A",
                "date": d.created_at.strftime("%Y-%m-%d") if d.created_at else None,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in documents
            if (d.record_type or "Other") == record_type
        ]
        categories.append({
            "recordType": record_type,
            "documents": docs_for_type
        })

    return jsonify({"categories": categories}), 200


@app.route("/api/documents/<int:user_id>", methods=["POST"])
def upload_document_base64(user_id):
    """Upload a base64-encoded document (frontend posts fileData as data URL)."""
    data = request.get_json()

    record_type = data.get("recordType")
    title = data.get("title")
    file_name = data.get("fileName")
    file_data = data.get("fileData")

    if not record_type or not title or not file_name or not file_data:
        return jsonify({"message": "Missing document details"}), 400

    try:
        if "," in file_data:
            header, base64_content = file_data.split(",", 1)
        else:
            base64_content = file_data

        import base64 as b64
        raw = b64.b64decode(base64_content)
    except Exception as exc:
        return jsonify({"message": f"Invalid file data: {exc}"}), 400

    ext = os.path.splitext(file_name)[1].lower() or ".pdf"
    safe_name = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file_name.replace(' ', '_')}"
    filepath = os.path.join(HEALTH_RECORDS_UPLOAD_FOLDER, safe_name)
    with open(filepath, "wb") as fh:
        fh.write(raw)

    size_bytes = len(raw)
    if size_bytes < 1024:
        file_size = f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        file_size = f"{round(size_bytes / 1024, 1)} KB"
    else:
        file_size = f"{round(size_bytes / (1024 * 1024), 1)} MB"

    doc = Document(
        user_id=user_id,
        title=title,
        record_type=record_type,
        file_path=filepath,
        file_size=file_size
    )
    db.session.add(doc)
    db.session.commit()

    return jsonify({"message": "Document uploaded", "id": doc.id}), 201


# =====================================================
# RECOVERY PHOTOS
# =====================================================

@app.route("/api/recovery-photos/<int:user_id>", methods=["GET"])
def get_recovery_photos(user_id):
    photos = (
        RecoveryPhoto.query
        .filter_by(user_id=user_id)
        .order_by(RecoveryPhoto.created_at.desc())
        .all()
    )
    return jsonify([
        {
            "id": p.id,
            "url": f"/uploads/recovery_photos/{os.path.basename(p.image_path)}",
            "date": p.created_at.strftime("%d %b"),
            "note": p.note
        }
        for p in photos
    ])


@app.route("/api/recovery-photos/<int:user_id>", methods=["POST"])
def upload_recovery_photo(user_id):
    file = request.files["photo"]
    note = request.form.get("note", "")

    filename = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    photo = RecoveryPhoto(user_id=user_id, image_path=filepath, note=note)
    db.session.add(photo)
    db.session.commit()

    return jsonify({"message": "uploaded", "id": photo.id}), 201


@app.route("/uploads/recovery_photos/<filename>")
def serve_recovery_photo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# =====================================================
# MEDICINES
# =====================================================

@app.route("/api/medicines/<int:user_id>", methods=["GET"])
def get_medicines(user_id):
    meds = Medicine.query.filter_by(user_id=user_id).all()

    return jsonify({
        "medicines": [
            {
                "id": m.id,
                "name": m.name,
                "instruction": m.instruction,
                "status": m.status,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "timing": m.timing,
                "expiry_date": m.expiry_date,
                "date": m.date.strftime("%Y-%m-%d") if m.date else None,
            }
            for m in meds
        ]
    })


@app.route("/api/medicines", methods=["POST"])
def add_medicine():
    data = request.get_json()
    dosage = data.get("dosage")
    timing = data.get("timing")
    instruction = data.get("instruction")
    if not instruction and dosage and timing:
        instruction = f"{dosage} • {timing}"

    medicine = Medicine(
        user_id=data["user_id"],
        name=data["name"],
        dosage=dosage,
        frequency=data.get("frequency"),
        timing=timing,
        instruction=instruction,
        status=data.get("status", "pending"),
        expiry_date=data.get("expiry_date") or None,
        date=datetime.strptime(data.get("date", date.today().isoformat()), "%Y-%m-%d").date()
    )
    db.session.add(medicine)
    db.session.commit()
    return jsonify({"message": "Medicine added", "id": medicine.id}), 201


@app.route("/api/medicines/<int:med_id>", methods=["PUT"])
def update_medicine(med_id):
    medicine = Medicine.query.get_or_404(med_id)
    data = request.get_json()

    if "status" in data:
        medicine.status = data["status"]
    if "instruction" in data:
        medicine.instruction = data["instruction"]
    if "expiry_date" in data:
        medicine.expiry_date = data["expiry_date"] or None

    db.session.commit()
    return jsonify({
        "message": "Medicine updated",
        "id": medicine.id,
        "name": medicine.name,
        "instruction": medicine.instruction,
        "status": medicine.status,
        "expiry_date": medicine.expiry_date,
        "date": medicine.date.strftime("%Y-%m-%d") if medicine.date else None
    })


@app.route("/api/medicines/<int:med_id>/status", methods=["PUT"])
def update_medicine_status(med_id):
    """Update medicine status (taken/pending/missed)."""
    medicine = Medicine.query.get_or_404(med_id)
    data = request.get_json()

    status = data.get("status")
    if status not in ("taken", "pending", "missed"):
        return jsonify({"message": "Status must be taken, pending, or missed"}), 400

    medicine.status = status

    if status == "missed":
        create_alert_if_not_exists(
            medicine.user_id, "warning", "Missed Medicine",
            f"{medicine.name} was missed on {date.today().strftime('%d %b %Y')}."
        )

    db.session.commit()

    return jsonify({
        "message": "Medicine status updated",
        "id": medicine.id,
        "name": medicine.name,
        "instruction": medicine.instruction,
        "status": medicine.status,
        "date": medicine.date.strftime("%Y-%m-%d") if medicine.date else None
    }), 200


@app.route("/api/medicines/<int:med_id>/taken", methods=["PUT"])
def mark_medicine_taken(med_id):
    """Mark a medicine dose as taken."""
    medicine = Medicine.query.get_or_404(med_id)

    if medicine.status != "pending":
        return jsonify({"message": "Can only mark pending medicines as taken"}), 400

    medicine.status = "taken"
    db.session.commit()

    return jsonify({
        "message": "Medicine marked as taken",
        "id": medicine.id,
        "name": medicine.name,
        "status": medicine.status
    }), 200


# =====================================================
# APPOINTMENTS
# =====================================================

@app.route("/api/appointments/<int:user_id>", methods=["GET"])
def get_appointments(user_id):
    appts = Appointment.query.filter_by(user_id=user_id).order_by(Appointment.date.asc()).all()

    return jsonify({
        "appointments": [
            {
                "id": a.id,
                "title": a.title,
                "subtitle": a.subtitle,
                "date": a.date.isoformat() if a.date else None,
                "time": a.time,
                "status": a.status,
                "doctor_name": a.doctor_name,
                "location": a.location,
                "type": a.appointment_type,
                "appointment_type": a.appointment_type,
                "doctor_id": a.doctor_id,
                "department": a.department,
                "reason": a.reason,
                "user_id": a.user_id,
                "notes": a.notes
            }
            for a in appts
        ]
    })


@app.route("/api/appointments", methods=["POST"])
def add_appointment():
    data = request.get_json()

    appointment_type = data.get("appointment_type") or data.get("type")
    doctor_id = data.get("doctor_id") or data.get("doctorId")
    department = data.get("department")
    reason = data.get("reason")

    appt = Appointment(
        user_id=data["user_id"],
        title=data["title"],
        subtitle=data.get("subtitle"),
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        time=data.get("time"),
        status=data.get("status", "Scheduled"),
        doctor_name=data.get("doctor_name"),
        location=data.get("location"),
        appointment_type=appointment_type,
        doctor_id=doctor_id,
        department=department,
        reason=reason,
        notes=data.get("notes")
    )
    db.session.add(appt)
    db.session.commit()

    create_alert_if_not_exists(
        appt.user_id, "success", "Appointment Scheduled",
        f"{appt.title} scheduled on {appt.date.strftime('%d %b %Y')}"
        f"{' at ' + appt.time if appt.time else ''}."
    )

    if doctor_id:
        create_alert_if_not_exists(
            doctor_id, "info", "New Appointment Request",
            f"Patient requested appointment for {data['date']} at {data.get('time')}."
        )

    return jsonify({"message": "Appointment added", "id": appt.id}), 201


@app.route("/api/appointments/<int:appt_id>", methods=["PUT"])
def update_appointment(appt_id):
    """Update/reschedule an appointment."""
    appt = Appointment.query.get_or_404(appt_id)
    data = request.get_json()

    if "date" in data:
        appt.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    if "time" in data:
        appt.time = data["time"]
    if "status" in data:
        appt.status = data["status"]
    if "doctor_name" in data:
        appt.doctor_name = data["doctor_name"]
    if "location" in data:
        appt.location = data["location"]
    if "notes" in data:
        appt.notes = data["notes"]
    if "title" in data:
        appt.title = data["title"]
    if "type" in data:
        appt.appointment_type = data["type"]
    if "appointment_type" in data:
        appt.appointment_type = data["appointment_type"]
    if "department" in data:
        appt.department = data["department"]
    if "doctorId" in data:
        appt.doctor_id = data["doctorId"]
    if "doctor_id" in data:
        appt.doctor_id = data["doctor_id"]
    if "reason" in data:
        appt.reason = data["reason"]

    db.session.commit()

    return jsonify({
        "message": "Appointment updated",
        "id": appt.id,
        "title": appt.title,
        "date": appt.date.isoformat() if appt.date else None,
        "time": appt.time,
        "status": appt.status,
        "type": appt.appointment_type,
        "department": appt.department,
        "doctor_id": appt.doctor_id,
        "reason": appt.reason
    }), 200


@app.route("/api/appointments/<int:appt_id>/status", methods=["PUT"])
def update_appointment_status(appt_id):
    """Update appointment status with alerts on confirmation/cancellation."""
    appt = Appointment.query.get_or_404(appt_id)
    data = request.get_json()

    status = data.get("status")
    if status not in ("scheduled", "cancelled", "upcoming", "pending"):
        return jsonify({"message": "Status must be scheduled, cancelled, upcoming, or pending"}), 400

    appt.status = status

    if status in ("scheduled", "upcoming"):
        create_alert_if_not_exists(
            appt.user_id, "success", "Appointment Confirmed",
            f"Appointment Confirmed: {appt.title} on {appt.date.strftime('%d %b %Y')}"
            f"{' at ' + appt.time if appt.time else ''}."
        )
    elif status == "cancelled":
        create_alert_if_not_exists(
            appt.user_id, "warning", "Appointment Cancelled",
            f"Appointment Cancelled: {appt.title}"
        )

    db.session.commit()

    return jsonify({
        "message": "Appointment status updated",
        "id": appt.id,
        "title": appt.title,
        "date": appt.date.isoformat() if appt.date else None,
        "time": appt.time,
        "status": appt.status
    }), 200


@app.route("/api/appointments/<int:appt_id>", methods=["DELETE"])
def delete_appointment(appt_id):
    """Cancel/delete an appointment."""
    appt = Appointment.query.get_or_404(appt_id)

    user_id = appt.user_id
    appointment_title = appt.title
    appointment_date = appt.date.strftime("%d %b %Y") if appt.date else "Unknown date"

    db.session.delete(appt)
    db.session.commit()

    create_alert_if_not_exists(
        user_id, "warning", "Appointment Cancelled",
        f"Appointment Cancelled — {appointment_title} on {appointment_date} has been cancelled."
    )

    return jsonify({"message": "Appointment deleted successfully"}), 200


# =====================================================
# ALERTS
# =====================================================

@app.route("/api/alerts/<int:user_id>", methods=["GET"])
def get_alerts(user_id):
    alerts = Alert.query.filter_by(user_id=user_id).order_by(Alert.created_at.desc()).all()
    return jsonify([
        {
            "id": a.id,
            "type": a.type,
            "title": a.title,
            "message": a.message,
            "read": a.is_read if a.is_read is not None else False,
            "source": a.source if a.source is not None else "system",
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in alerts
    ])


@app.route("/api/alerts", methods=["POST"])
def add_alert():
    data = request.get_json()
    alert = Alert(
        user_id=data["user_id"],
        type=data.get("type", "info"),
        title=data["title"],
        message=data.get("message")
    )
    db.session.add(alert)
    db.session.commit()
    return jsonify({"message": "Alert added", "id": alert.id}), 201


@app.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    """Mark an alert as read."""
    alert = Alert.query.get_or_404(notification_id)
    alert.is_read = True
    db.session.commit()
    return jsonify({"message": "Notification marked as read", "id": alert.id}), 200


@app.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    """Delete an alert."""
    alert = Alert.query.get_or_404(notification_id)
    db.session.delete(alert)
    db.session.commit()
    return jsonify({"message": "Notification deleted", "id": notification_id}), 200


# =====================================================
# REMINDERS CHECK (medicine missed, task missed, appointment tomorrow)
# =====================================================

@app.route("/api/check-reminders/<int:user_id>", methods=["GET"])
def check_reminders(user_id):
    user = User.query.get_or_404(user_id)
    today = date.today()
    tomorrow = today + timedelta(days=1)

    # Day-before appointment reminder
    for appt in Appointment.query.filter_by(user_id=user_id, date=tomorrow).all():
        create_alert_if_not_exists(
            user_id, "info", f"Appointment Tomorrow: {appt.title}",
            f"You have '{appt.title}' scheduled tomorrow{' at ' + appt.time if appt.time else ''}."
        )

    # Same-day appointment reminder
    today_appts = Appointment.query.filter(
        Appointment.user_id == user_id,
        Appointment.date == today,
        Appointment.status.in_(["Scheduled", "Upcoming"])
    ).all()
    for appt in today_appts:
        alert_message = appt.title
        if appt.time:
            alert_message += f" — scheduled at {appt.time}"
        create_alert_if_not_exists(user_id, "info", f"Appointment Today: {appt.title}", alert_message)

    # Missed appointments (auto-update status)
    missed_appts = Appointment.query.filter(
        Appointment.user_id == user_id,
        Appointment.date < today,
        Appointment.status.in_(["Scheduled", "Upcoming"])
    ).all()
    for appt in missed_appts:
        appt.status = "Missed"
        db.session.add(appt)
        create_alert_if_not_exists(
            user_id, "warning", "Missed Appointment",
            f"{appt.title} on {appt.date.strftime('%d %b %Y')} was missed."
        )
    if missed_appts:
        db.session.commit()

    # Missed medicines
    missed_meds = Medicine.query.filter(
        Medicine.user_id == user_id, Medicine.date < today, Medicine.status == "pending"
    ).all()
    if missed_meds:
        names = ", ".join([m.name for m in missed_meds[:3]])
        create_alert_if_not_exists(
            user_id, "warning", "Medicine Missed",
            f"You missed the following medicine(s): {names}."
        )

    # Missed recovery tasks
    missed_tasks = RecoveryTask.query.filter(
        RecoveryTask.user_id == user_id, RecoveryTask.date < today, RecoveryTask.status == "pending"
    ).all()
    if missed_tasks:
        create_alert_if_not_exists(
            user_id, "warning", "Recovery Task Missed",
            f"You have {len(missed_tasks)} incomplete recovery task(s) from previous days."
        )

    # Scanned medicine expiry reminders (additive - existing reminders untouched)
    for scan in PatientMedicine.query.filter_by(user_id=user_id).all():
        expiry_status = compute_expiry_status(scan.expiry_date)
        if expiry_status == "Expired":
            create_alert_if_not_exists(
                user_id, "warning", "Medicine Expired",
                f"{scan.medicine_name or 'Scanned medicine'} expired on {scan.expiry_date}."
            )
        elif expiry_status == "Expiring Soon":
            create_alert_if_not_exists(
                user_id, "warning", "Medicine Expiring Soon",
                f"{scan.medicine_name or 'Scanned medicine'} expires on {scan.expiry_date}."
            )

    pending_medicines = Medicine.query.filter_by(user_id=user_id, status="pending").count()
    pending_tasks = RecoveryTask.query.filter_by(user_id=user_id, status="pending").count()
    upcoming_appointments = Appointment.query.filter(
        Appointment.user_id == user_id, Appointment.date >= today
    ).count()

    return jsonify({
        "message": "Reminders checked successfully",
        "checked_at": datetime.utcnow().isoformat(),
        "reminders": {
            "medicine": pending_medicines,
            "recovery_tasks": pending_tasks,
            "appointments": upcoming_appointments,
        },
        "patient": {"id": user.id, "name": user.name, "role": user.role}
    }), 200


# =====================================================
# PATIENT PROFILE
# =====================================================

@app.route("/api/patient/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    return jsonify({
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "phone": patient.phone,
        "dob": patient.dob,
        "age": patient.age,
        "gender": patient.gender,
        "recovery_type": patient.recovery_type,
        "emergency_contact": patient.emergency_contact,
        "height": patient.height,
        "weight": patient.weight,
        "blood_group": patient.blood_group,
        "address": patient.address,
        "medical_conditions": patient.medical_conditions,
        "allergies": patient.allergies,
        "current_medications": patient.current_medications,
        "previous_surgery": patient.previous_surgery,
        "medical_history": patient.medical_history,
        "language": patient.language,
        "notify_medicine": patient.notify_medicine,
        "notify_appointment": patient.notify_appointment,
        "notify_email": patient.notify_email
    }), 200


@app.route("/api/patient/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    data = request.get_json()

    if "height" in data:
        patient.height = data["height"]
    if "weight" in data:
        patient.weight = data["weight"]
    if "blood_group" in data:
        patient.blood_group = data["blood_group"]
    if "address" in data:
        patient.address = data["address"]
    if "medical_conditions" in data:
        patient.medical_conditions = data["medical_conditions"]
    if "allergies" in data:
        patient.allergies = data["allergies"]
    if "current_medications" in data:
        patient.current_medications = data["current_medications"]
    if "previous_surgery" in data:
        patient.previous_surgery = data["previous_surgery"]
    if "medical_history" in data:
        patient.medical_history = data["medical_history"]

    db.session.commit()
    check_bmi_alert(patient)

    return jsonify({"message": "Patient details updated successfully!"}), 200


# =====================================================
# SETTINGS
# =====================================================

@app.route("/api/patient/<int:patient_id>/settings", methods=["GET"])
def get_settings(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    settings = UserSettings.query.filter_by(user_id=patient_id).first()
    if not settings:
        settings = UserSettings(user_id=patient_id)
        db.session.add(settings)
        db.session.commit()

    return jsonify({
        "language": patient.language,
        "notify_medicine": patient.notify_medicine,
        "notify_appointment": patient.notify_appointment,
        "notify_email": patient.notify_email,
        "notify_health_alert": settings.notify_health_alert,
        "two_factor_auth": settings.two_factor_auth,
        "health_goals": settings.health_goals,
        "reminder_frequency": settings.reminder_frequency,
        "units": settings.units,
        "ai_recommendations": settings.ai_recommendations,
        "personalized_suggestions": settings.personalized_suggestions,
        "ai_insights": settings.ai_insights,
        "smartwatch_connected": settings.smartwatch_connected,
        "fitness_tracker_connected": settings.fitness_tracker_connected
    }), 200


@app.route("/api/patient/<int:patient_id>/settings", methods=["PUT"])
def update_settings(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    data = request.get_json()
    settings = UserSettings.query.filter_by(user_id=patient_id).first()
    if not settings:
        settings = UserSettings(user_id=patient_id)
        db.session.add(settings)

    if "language" in data:
        patient.language = data["language"]
    if "notify_medicine" in data:
        patient.notify_medicine = data["notify_medicine"]
    if "notify_appointment" in data:
        patient.notify_appointment = data["notify_appointment"]
    if "notify_email" in data:
        patient.notify_email = data["notify_email"]
    if "notify_health_alert" in data:
        settings.notify_health_alert = data["notify_health_alert"]
    if "two_factor_auth" in data:
        settings.two_factor_auth = data["two_factor_auth"]
    if "health_goals" in data:
        settings.health_goals = data["health_goals"]
    if "reminder_frequency" in data:
        settings.reminder_frequency = data["reminder_frequency"]
    if "units" in data:
        settings.units = data["units"]
    if "ai_recommendations" in data:
        settings.ai_recommendations = data["ai_recommendations"]
    if "personalized_suggestions" in data:
        settings.personalized_suggestions = data["personalized_suggestions"]
    if "ai_insights" in data:
        settings.ai_insights = data["ai_insights"]
    if "smartwatch_connected" in data:
        settings.smartwatch_connected = data["smartwatch_connected"]
    if "fitness_tracker_connected" in data:
        settings.fitness_tracker_connected = data["fitness_tracker_connected"]

    db.session.commit()
    return jsonify({"message": "Settings updated successfully!"}), 200


@app.route("/api/patient/<int:patient_id>/preferences", methods=["PUT"])
def update_preferences(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    data = request.get_json()
    patient.language = data.get("language", patient.language)
    patient.notify_medicine = data.get("notify_medicine", patient.notify_medicine)
    patient.notify_appointment = data.get("notify_appointment", patient.notify_appointment)
    patient.notify_email = data.get("notify_email", patient.notify_email)

    db.session.commit()
    return jsonify({"message": "Preferences updated!"}), 200


# =====================================================
# CHANGE PASSWORD
# =====================================================

@app.route("/api/patient/<int:patient_id>/password", methods=["PUT"])
def change_password(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    data = request.get_json()
    if patient.password != data.get("old_password"):
        return jsonify({"message": "Old password is incorrect"}), 401

    patient.password = data.get("new_password")
    db.session.commit()
    return jsonify({"message": "Password updated successfully!"}), 200


@app.route("/api/scan-medicine", methods=["POST"])
def scan_medicine():

    if "image" not in request.files:
        return jsonify({
            "error": "No image uploaded"
        }), 400

    image = request.files["image"]

    if image.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    save_name = "scan_%d_%s" % (
        int(datetime.utcnow().timestamp()),
        os.path.basename(image.filename).replace(" ", "_")
    )

    filepath = os.path.join(
        MEDICINE_UPLOAD_FOLDER,
        save_name
    )

    try:
        image.save(filepath)

        result = extract_medicine_info(filepath)

        if result.get("error"):
            error_msg = result["error"]
            return jsonify({
                **result,
                "saved": False,
                "message": error_msg,
                "reason": error_msg,
                "medicineName": None,
                "expiryDate": result.get("expiry_date"),
                "status": "Not Detected",
                "rawText": result.get("raw_text", ""),
                "preprocessedImage": result.get("preprocessed_image"),
            }), 200

        user_id = request.form.get("user_id")
        if not user_id:
            return jsonify(result), 200

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid user_id"}), 400

        patient = User.query.filter_by(id=user_id, role="patient").first()
        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        name = (request.form.get("medicine_name_override") or "").strip() \
            or (result.get("medicine_name") or "").strip()

        expiry = result.get("expiry_date")

        if not name:
            raw_text = (result.get("raw_text") or "").strip()
            if not raw_text:
                reason = ("No readable text was found in the image. "
                          "Try a clearer, well-lit photo of the medicine label.")
            else:
                reason = "No known medicine name matched the extracted text."
            return jsonify({
                "message": "Medicine name could not be detected from the image. The medicine was not saved.",
                "saved": False,
                "error": "Medicine name could not be detected from the image.",
                "reason": reason,
                "medicineName": None,
                "expiryDate": expiry,
                "status": "Not Detected",
                "rawText": raw_text,
                "preprocessedImage": result.get("preprocessed_image"),
                "raw": result,
            }), 200

        status = compute_expiry_status(expiry)

        record = PatientMedicine(
            user_id=user_id,
            medicine_name=name,
            generic_name=result.get("generic_name"),
            mfg_date=result.get("mfg_date"),
            expiry_date=expiry,
            image_path=save_name,
            status=status,
        )
        db.session.add(record)
        db.session.commit()

        if status in ("Expired", "Expiring Soon"):
            expiry_label = expiry or "an unknown date"
            create_alert_if_not_exists(
                user_id,
                "warning",
                f"Medicine {status}",
                f"{name or 'Scanned medicine'} is {status.lower()} (expires {expiry_label})."
            )

        return jsonify({
            "message": "Medicine scanned and saved",
            "saved": True,
            "id": record.id,
            "medicineName": record.medicine_name,
            "expiryDate": record.expiry_date,
            "status": record.status,
            "purpose": result.get("purpose"),
            "rawText": result.get("raw_text", ""),
            "preprocessedImage": result.get("preprocessed_image"),
            "raw": result,
        }), 201
    except Exception as exc:
        try:
            os.remove(filepath)
        except OSError:
            pass
        return jsonify({
            "message": "Medicine scan failed",
            "saved": False,
            "error": "Scan failed: %s" % exc,
        }), 500


@app.route("/api/scanned-medicines/<int:user_id>", methods=["GET"])
def get_scanned_medicines(user_id):
    user = User.query.get_or_404(user_id)

    scans = PatientMedicine.query.filter_by(user_id=user_id).order_by(
        PatientMedicine.created_at.desc()
    ).all()

    return jsonify({
        "message": "Scanned medicines fetched successfully",
        "scans": [
            {
                "id": s.id,
                "medicineName": s.medicine_name,
                "expiryDate": s.expiry_date,
                "status": s.status,
                "purpose": lookup_medicine_purpose(s.medicine_name),
                "mfgDate": s.mfg_date,
                "imagePath": s.image_path,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in scans
        ]
    }), 200

# =====================================================
# UPDATE CONTACT
# =====================================================

@app.route("/api/patient/<int:patient_id>/contact", methods=["PUT"])
def update_contact(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    data = request.get_json()
    if patient.password != data.get("current_password"):
        return jsonify({"message": "Password is incorrect"}), 401

    patient.email = data.get("email", patient.email)
    patient.phone = data.get("phone", patient.phone)

    db.session.commit()
    return jsonify({"message": "Contact details updated!"}), 200


# =====================================================
# DELETE ACCOUNT
# =====================================================

@app.route("/api/patient/<int:patient_id>", methods=["DELETE"])
def delete_account(patient_id):
    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    data = request.get_json()
    if patient.password != data.get("password"):
        return jsonify({"message": "Password is incorrect"}), 401

    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": "Account deleted successfully"}), 200


# =====================================================
# DOCTOR ENDPOINTS (recovery metrics / overview)
# =====================================================

def _compute_patient_recovery(user_id):
    """Compute recovery metrics for a patient using today's date range."""
    today = date.today()

    tasks = RecoveryTask.query.filter_by(user_id=user_id, date=today).all()
    physical_recovery = round(
        (len([t for t in tasks if t.status == "done"]) / len(tasks)) * 100, 1
    ) if tasks else 0

    meds = Medicine.query.filter_by(user_id=user_id, date=today).all()
    taken = [m for m in meds if str(m.status).lower() in ("taken", "done", "completed")]
    medication_recovery = round(
        (len(taken) / len(meds)) * 100, 1
    ) if meds else 0

    activities = DailyActivity.query.filter_by(user_id=user_id, date=today).all()
    done_acts = [a for a in activities if a.status == "done"]
    daily_activity = round(
        (len(done_acts) / len(activities)) * 100, 1
    ) if activities else 0

    latest = (
        HealthRecord.query
        .filter_by(user_id=user_id)
        .order_by(HealthRecord.recorded_at.desc())
        .first()
    )
    lab_factor = 100
    if latest:
        vitals = [
            get_status("blood_sugar", latest.blood_sugar),
            get_status("heart_rate", latest.heart_rate),
            get_status("systolic", latest.systolic),
            get_status("diastolic", latest.diastolic),
            get_status("hemoglobin", latest.hemoglobin),
        ]
        abnormal = len([s for s in vitals if s in ("high", "low")])
        lab_factor = max(0, 100 - abnormal * 22)

    overall = round(
        physical_recovery * 0.35
        + medication_recovery * 0.35
        + daily_activity * 0.2
        + lab_factor * 0.1,
        1
    )

    return {
        "physical_recovery": physical_recovery,
        "medication_recovery": medication_recovery,
        "daily_activity": daily_activity,
        "overall": overall,
    }


def _patient_status(overall):
    if overall >= 85:
        return "Excellent"
    if overall >= 70:
        return "Improving"
    if overall >= 40:
        return "Monitoring"
    return "Critical"


@app.route("/api/doctor/<int:doctor_id>/alerts", methods=["GET"])
def get_doctor_alerts(doctor_id):
    doctor = User.query.get_or_404(doctor_id)
    connection_ids = [c.patient_id for c in DoctorPatient.query.filter_by(doctor_id=doctor_id).all()]
    alerts = Alert.query.filter(
        db.or_(Alert.user_id == doctor_id, Alert.user_id.in_(connection_ids))
    ).order_by(Alert.created_at.desc()).all()

    result = []
    for a in alerts:
        patient_name = None
        patient_id = None
        if a.user_id != doctor_id:
            patient = User.query.get(a.user_id)
            if patient:
                patient_name = patient.name
                patient_id = patient.id
        result.append({
            "id": a.id,
            "type": a.type,
            "title": a.title,
            "message": a.message,
            "read": a.is_read if a.is_read is not None else False,
            "is_read": a.is_read if a.is_read is not None else False,
            "source": a.source if a.source is not None else "system",
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "patientId": patient_id,
            "patientName": patient_name or "Doctor notification",
        })
    return jsonify({"alerts": result})


@app.route("/api/doctor/<int:doctor_id>/summary", methods=["GET"])
def get_doctor_summary(doctor_id):
    """Doctor overview computed from their connected patients."""
    doctor = User.query.get_or_404(doctor_id)

    connection_ids = [c.patient_id for c in DoctorPatient.query.filter_by(doctor_id=doctor_id).all()]
    if connection_ids:
        patients = User.query.filter(User.id.in_(connection_ids)).all()
    else:
        patients = User.query.filter_by(role="patient").all()

    patients_data = []
    overall_sum = physical_sum = medication_sum = daily_sum = 0
    improving = need_monitoring = excellent = critical = 0

    today = date.today()
    today_appt_count = 0
    pending_reports = 0
    doctor_appointments = []
    doctor_records = []

    for p in patients:
        rec = _compute_patient_recovery(p.id)
        overall_sum += rec["overall"]
        physical_sum += rec["physical_recovery"]
        medication_sum += rec["medication_recovery"]
        daily_sum += rec["daily_activity"]

        status = _patient_status(rec["overall"])
        if status == "Excellent":
            excellent += 1
        elif status == "Improving":
            improving += 1
        elif status == "Monitoring":
            need_monitoring += 1
        else:
            critical += 1

        patient_alerts = (
            Alert.query.filter_by(user_id=p.id)
            .order_by(Alert.created_at.desc())
            .limit(3)
            .all()
        )
        patients_data.append({
            "id": p.id,
            "name": p.name,
            "age": p.age,
            "condition": p.recovery_type,
            "recovery": rec["overall"],
            "status": status,
            "alerts": [
                {
                    "id": a.id,
                    "type": a.type,
                    "title": a.title,
                    "message": a.message,
                    "read": a.is_read if a.is_read is not None else False,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in patient_alerts
            ],
        })

        today_appt_count += Appointment.query.filter_by(user_id=p.id, date=today).count()
        pending_reports += Alert.query.filter_by(user_id=p.id, is_read=False).count()

        for a in Appointment.query.filter_by(user_id=p.id).order_by(Appointment.date.asc()).all():
            doctor_appointments.append({
                "id": a.id,
                "title": a.title,
                "type": a.appointment_type,
                "appointment_type": a.appointment_type,
                "date": a.date.isoformat() if a.date else None,
                "time": a.time,
                "location": a.location,
                "status": a.status,
                "user_id": a.user_id,
                "doctor_name": a.doctor_name,
                "doctor_id": a.doctor_id,
                "department": a.department,
                "reason": a.reason,
                "patientName": p.name,
            })

        latest = (
            HealthRecord.query
            .filter_by(user_id=p.id)
            .order_by(HealthRecord.recorded_at.desc())
            .first()
        )
        doctor_records.append({
            "id": p.id,
            "patientName": p.name,
            "title": f"{p.name} - Latest vitals",
            "subtitle": (
                f"Latest update: {latest.recorded_at.strftime('%d %b %Y, %I:%M %p')}"
                if latest and latest.recorded_at
                else "No recent vitals recorded"
            ),
            "type": "Vitals",
        })

    count = max(len(patients), 1)
    overall_avg = round(overall_sum / count, 1)
    physical_avg = round(physical_sum / count, 1)
    medication_avg = round(medication_sum / count, 1)
    daily_avg = round(daily_sum / count, 1)

    return jsonify({
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "specialization": doctor.specialization,
        },
        "overview": {
            "totalPatients": len(patients),
            "todaysAppointments": today_appt_count,
            "averageRecovery": overall_avg,
            "pendingReports": pending_reports,
        },
        "metrics": {
            "overall": overall_avg,
            "physicalRecovery": physical_avg,
            "medicationRecovery": medication_avg,
            "dailyActivity": daily_avg,
            "improvingPatients": improving,
            "needMonitoring": need_monitoring,
            "excellentRecovery": excellent,
        },
        "patients": patients_data,
        "appointments": doctor_appointments,
        "healthRecords": doctor_records,
    }), 200


@app.route("/api/doctor/<int:doctor_id>/patients/<int:patient_id>/overview", methods=["GET"])
def get_doctor_patient_overview(doctor_id, patient_id):
    """Full patient overview for the doctor detail view."""
    patient = User.query.get_or_404(patient_id)

    if not DoctorPatient.query.filter_by(doctor_id=doctor_id, patient_id=patient_id).first():
        return jsonify({"message": "This patient is not connected to the doctor."}), 403

    recovery = _compute_patient_recovery(patient_id)
    today = date.today()

    meds = Medicine.query.filter_by(user_id=patient_id, date=today).all()
    health_records = (
        HealthRecord.query
        .filter_by(user_id=patient_id)
        .order_by(HealthRecord.recorded_at.desc())
        .all()
    )
    appts = (
        Appointment.query
        .filter_by(user_id=patient_id)
        .order_by(Appointment.date.asc())
        .all()
    )
    alerts = (
        Alert.query
        .filter_by(user_id=patient_id)
        .order_by(Alert.created_at.desc())
        .all()
    )

    return jsonify({
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "phone": patient.phone,
            "age": patient.age,
            "gender": patient.gender,
            "recovery_type": patient.recovery_type,
            "blood_group": patient.blood_group,
            "address": patient.address,
            "emergency_contact": patient.emergency_contact,
        },
        "recovery": {
            "overall": recovery["overall"],
            "physicalRecovery": recovery["physical_recovery"],
            "medicationRecovery": recovery["medication_recovery"],
            "dailyActivity": recovery["daily_activity"],
        },
        "medicines": [
            {
                "id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "schedule": m.timing,
                "status": m.status,
                "frequency": m.frequency,
                "timing": m.timing,
            }
            for m in meds
        ],
        "healthRecords": [
            {
                "id": r.id,
                "type": "Vitals",
                "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
                "blood_sugar": r.blood_sugar,
                "heart_rate": r.heart_rate,
                "systolic": r.systolic,
                "diastolic": r.diastolic,
                "hemoglobin": r.hemoglobin,
            }
            for r in health_records
        ],
        "appointments": [
            {
                "id": a.id,
                "title": a.title,
                "type": a.appointment_type,
                "appointment_type": a.appointment_type,
                "date": a.date.isoformat() if a.date else None,
                "time": a.time,
                "location": a.location,
                "status": a.status,
                "user_id": a.user_id,
                "doctor_id": a.doctor_id,
                "doctor_name": a.doctor_name,
                "department": a.department,
                "reason": a.reason,
            }
            for a in appts
        ],
        "alerts": [
            {
                "id": a.id,
                "type": a.type,
                "title": a.title,
                "message": a.message,
                "read": a.is_read if a.is_read is not None else False,
            }
            for a in alerts
        ],
    }), 200


# =====================================================
# DAILY HEALTH CHECK-IN
# =====================================================

@app.route("/api/daily-checkin", methods=["POST"])
def add_daily_checkin():
    """Create or patch today's daily health check-in for a patient (upsert)."""
    data = request.get_json()

    user_id = data.get("user_id")
    checkin_date_str = data.get("date") or date.today().isoformat()

    try:
        checkin_date = datetime.strptime(checkin_date_str, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid date format"}), 400

    checkin = DailyCheckin.query.filter_by(
        user_id=user_id, checkin_date=checkin_date
    ).first()
    if not checkin:
        checkin = DailyCheckin(user_id=user_id, checkin_date=checkin_date)
        db.session.add(checkin)

    if "pain_level" in data:
        checkin.pain_level = data["pain_level"]
    if "sleep_hours" in data:
        checkin.sleep_hours = data["sleep_hours"]
    if "sleep_quality" in data:
        checkin.sleep_quality = data["sleep_quality"]
    if "activity_level" in data:
        checkin.activity_level = data["activity_level"]
    if "symptoms" in data:
        checkin.symptoms = data["symptoms"]
    if "temperature" in data:
        checkin.temperature = data["temperature"]
    if "systolic" in data:
        checkin.systolic = data["systolic"]
    if "diastolic" in data:
        checkin.diastolic = data["diastolic"]
    if "spo2" in data:
        checkin.spo2 = data["spo2"]
    if "notes" in data:
        checkin.notes = data["notes"]

    db.session.commit()

    # --- Auto alerts from abnormal readings (dedupes same-day) ---
    if checkin.temperature is not None and checkin.temperature > 38.0:
        create_alert_if_not_exists(
            user_id, "warning", "Fever Detected",
            f"Your temperature {checkin.temperature}°C is high. Please rest and consult your doctor if it persists."
        )
    if checkin.spo2 is not None and checkin.spo2 < 92:
        create_alert_if_not_exists(
            user_id, "warning", "Low Blood Oxygen",
            f"Your SpO2 is {checkin.spo2}%, which is below the safe range. Please seek medical attention."
        )

    return jsonify({
        "message": "Check-in saved successfully!",
        "id": checkin.id,
        "date": checkin.checkin_date.isoformat(),
        "saved": True,
    }), 201


@app.route("/api/daily-checkins/<int:user_id>", methods=["GET"])
def get_daily_checkins(user_id):
    """Recent daily check-ins for a user (newest first)."""
    limit = request.args.get("limit", 0, type=int)
    query = (
        DailyCheckin.query
        .filter_by(user_id=user_id)
        .order_by(DailyCheckin.checkin_date.desc())
    )
    checkins = query.limit(limit).all() if limit else query.limit(30).all()

    return jsonify({
        "checkins": [
            {
                "id": c.id,
                "date": c.checkin_date.isoformat(),
                "pain_level": c.pain_level,
                "sleep_hours": c.sleep_hours,
                "sleep_quality": c.sleep_quality,
                "activity_level": c.activity_level,
                "symptoms": c.symptoms,
                "temperature": c.temperature,
                "systolic": c.systolic,
                "diastolic": c.diastolic,
                "spo2": c.spo2,
                "notes": c.notes,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in checkins
        ]
    }), 200


# =====================================================
# RECOVERY PLAN MANAGEMENT (doctor-driven)
# =====================================================

def _serialize_recovery_plan(plan):
    activities = RecoveryPlanActivity.query.filter_by(plan_id=plan.id).all()
    goals = RecoveryPlanGoal.query.filter_by(plan_id=plan.id).all()
    return {
        "id": plan.id,
        "title": plan.title,
        "description": plan.description,
        "doctor_id": plan.doctor_id,
        "patient_id": plan.patient_id,
        "start_date": plan.start_date.isoformat() if plan.start_date else None,
        "end_date": plan.end_date.isoformat() if plan.end_date else None,
        "status": plan.status,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "activities": [
            {
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "frequency": a.frequency,
                "duration_min": a.duration_min,
                "status": a.status,
                "due_date": a.due_date.isoformat() if a.due_date else None,
            }
            for a in activities
        ],
        "goals": [
            {
                "id": g.id,
                "name": g.name,
                "target_value": g.target_value,
                "instruction": g.instruction,
                "achieved": g.achieved,
            }
            for g in goals
        ],
    }


@app.route("/api/recovery-plans", methods=["POST"])
def create_recovery_plan():
    """Doctor creates a recovery plan for a patient and pushes one-way to RecoveryTask."""
    data = request.get_json()

    doctor_id = data.get("doctor_id")
    patient_id = data.get("patient_id")

    plan = RecoveryPlan(
        doctor_id=doctor_id,
        patient_id=patient_id,
        title=data.get("title"),
        description=data.get("description"),
        start_date=parse_date_or_none(data.get("start_date")),
        end_date=parse_date_or_none(data.get("end_date")),
        status=data.get("status", "active"),
    )
    db.session.add(plan)
    db.session.flush()

    for act in data.get("activities", []):
        db.session.add(RecoveryPlanActivity(
            plan_id=plan.id,
            name=act.get("name"),
            description=act.get("description"),
            frequency=act.get("frequency", "Daily"),
            duration_min=act.get("duration_min", 0),
            status="pending",
            due_date=parse_date_or_none(act.get("due_date")),
        ))

        today = date.today()
        if act.get("is_recovery_task") and not RecoveryTask.query.filter_by(
            user_id=patient_id, date=today, name=act.get("name")
        ).first():
            db.session.add(RecoveryTask(
                user_id=patient_id,
                date=today,
                name=act.get("name"),
                tag=act.get("tag") or "Recovery",
                status="pending",
            ))

    for goal in data.get("goals", []):
        db.session.add(RecoveryPlanGoal(
            plan_id=plan.id,
            name=goal.get("name"),
            target_value=goal.get("target_value", 0),
            instruction=goal.get("instruction"),
            achieved=False,
        ))

    db.session.commit()

    return jsonify({
        "message": "Recovery plan created successfully",
        "plan": _serialize_recovery_plan(plan),
    }), 201


@app.route("/api/recovery-plans/<int:plan_id>", methods=["GET"])
def get_recovery_plan(plan_id):
    plan = RecoveryPlan.query.get_or_404(plan_id)
    return jsonify({"plan": _serialize_recovery_plan(plan)}), 200


@app.route("/api/recovery-plans/patient/<int:patient_id>", methods=["GET"])
def get_recovery_plans_for_patient(patient_id):
    plans = (
        RecoveryPlan.query
        .filter_by(patient_id=patient_id)
        .order_by(RecoveryPlan.created_at.desc())
        .all()
    )
    return jsonify({"plans": [_serialize_recovery_plan(p) for p in plans]}), 200


@app.route("/api/recovery-plans/doctor/<int:doctor_id>", methods=["GET"])
def get_recovery_plans_for_doctor(doctor_id):
    plans = (
        RecoveryPlan.query
        .filter_by(doctor_id=doctor_id)
        .order_by(RecoveryPlan.created_at.desc())
        .all()
    )
    return jsonify({"plans": [_serialize_recovery_plan(p) for p in plans]}), 200


@app.route("/api/recovery-plans/<int:plan_id>", methods=["PUT"])
def update_recovery_plan(plan_id):
    plan = RecoveryPlan.query.get_or_404(plan_id)
    data = request.get_json()

    if "title" in data:
        plan.title = data["title"]
    if "description" in data:
        plan.description = data["description"]
    if "status" in data:
        plan.status = data["status"]
    if "start_date" in data:
        plan.start_date = parse_date_or_none(data["start_date"])
    if "end_date" in data:
        plan.end_date = parse_date_or_none(data["end_date"])

    for act in data.get("activities", []):
        activity = RecoveryPlanActivity.query.get(act.get("id"))
        if not activity:
            continue
        if "status" in act:
            activity.status = act["status"]
        if "name" in act:
            activity.name = act["name"]
            today = date.today()
            sync_recovery_task_bridge(plan.patient_id, today, act["name"], act.get("status"))

    for goal in data.get("goals", []):
        goal_model = RecoveryPlanGoal.query.get(goal.get("id"))
        if goal_model and "achieved" in goal:
            goal_model.achieved = goal["achieved"]

    db.session.commit()
    return jsonify({
        "message": "Recovery plan updated",
        "plan": _serialize_recovery_plan(plan),
    }), 200


@app.route("/api/recovery-plans/<int:plan_id>/activities", methods=["POST"])
def add_recovery_plan_activity(plan_id):
    plan = RecoveryPlan.query.get_or_404(plan_id)
    data = request.get_json()

    activity = RecoveryPlanActivity(
        plan_id=plan.id,
        name=data.get("name"),
        description=data.get("description"),
        frequency=data.get("frequency", "Daily"),
        duration_min=data.get("duration_min", 0),
        status="pending",
        due_date=parse_date_or_none(data.get("due_date")),
    )
    db.session.add(activity)

    if data.get("is_recovery_task"):
        today = date.today()
        sync_recovery_task_bridge(plan.patient_id, today, data.get("name"), "pending")

    db.session.commit()
    return jsonify({"message": "Activity added", "activity": {
        "id": activity.id,
        "name": activity.name,
        "status": activity.status,
    }}), 201


@app.route("/api/recovery-plans/goals", methods=["POST"])
def add_recovery_plan_goal():
    data = request.get_json()
    goal = RecoveryPlanGoal(
        plan_id=data["plan_id"],
        name=data["name"],
        target_value=data.get("target_value", 0),
        instruction=data.get("instruction"),
        achieved=False,
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({"message": "Goal added", "goal": {
        "id": goal.id,
        "name": goal.name,
    }}), 201


@app.route("/api/recovery-plans/<int:plan_id>", methods=["DELETE"])
def delete_recovery_plan(plan_id):
    plan = RecoveryPlan.query.get_or_404(plan_id)
    RecoveryPlanActivity.query.filter_by(plan_id=plan.id).delete()
    RecoveryPlanGoal.query.filter_by(plan_id=plan.id).delete()
    db.session.delete(plan)
    db.session.commit()
    return jsonify({"message": "Recovery plan deleted"}), 200


# =====================================================
# HEALTH SCORE & ANALYTICS
# =====================================================

def compute_health_score(user_id):
    """Compute a 0-100 health score from check-ins, vitals, tasks and gamification."""

    latest_vitals = (
        HealthRecord.query
        .filter_by(user_id=user_id)
        .order_by(HealthRecord.recorded_at.desc())
        .first()
    )

    checkins = (
        DailyCheckin.query
        .filter_by(user_id=user_id)
        .order_by(DailyCheckin.checkin_date.desc())
        .limit(14)
        .all()
    )

    tasks = RecoveryTask.query.filter_by(user_id=user_id, status="done").count()
    total_tasks = RecoveryTask.query.filter_by(user_id=user_id).count()

    score = 70
    components = {}

    # Vitals contribution (±20)
    if latest_vitals:
        vital_points = 10
        statuses = [
            get_status("blood_sugar", latest_vitals.blood_sugar),
            get_status("heart_rate", latest_vitals.heart_rate),
            get_status("systolic", latest_vitals.systolic),
            get_status("diastolic", latest_vitals.diastolic),
            get_status("hemoglobin", latest_vitals.hemoglobin),
        ]
        abnormal = sum(1 for s in statuses if s in ("high", "low"))
        vital_points -= abnormal * 5
        vital_points = max(0, vital_points)
        components["vitals"] = vital_points
        score += vital_points - 10
    else:
        components["vitals"] = 0

    # Check-in consistency (+0..15)
    streak_bonus = 0
    if checkins:
        ordered = sorted([c.checkin_date for c in checkins], reverse=True)
        day = date.today()
        for d in ordered:
            if d == day:
                streak_bonus += 3
                day -= timedelta(days=1)
            else:
                break
        if checkins[0].checkin_date == date.today():
            streak_bonus += 2
        streak_bonus = min(15, streak_bonus)
    components["checkin_streak"] = streak_bonus
    score += streak_bonus

    # Task completion (+0..15)
    task_points = 0
    if total_tasks:
        task_points = round((tasks / total_tasks) * 15)
    components["tasks"] = task_points
    score += task_points

    score = max(0, min(100, round(score)))
    return score, components


@app.route("/api/health-score/<int:user_id>", methods=["GET"])
def get_health_score(user_id):
    score, components = compute_health_score(user_id)
    snapshot = (
        HealthScoreSnapshot.query
        .filter_by(user_id=user_id)
        .order_by(HealthScoreSnapshot.snapshot_date.desc())
        .first()
    )
    return jsonify({
        "score": score,
        "status": get_status("score", score) if False else ("Good" if score >= 70 else ("Fair" if score >= 50 else "Needs Attention")),
        "components": components,
        "last_snapshot": snapshot.snapshot_date.isoformat() if snapshot else None,
    }), 200


@app.route("/api/health-score/<int:user_id>/history", methods=["GET"])
def get_health_score_history(user_id):
    """Score snapshots over time for the analytics chart."""
    days = request.args.get("days", 30, type=int)
    since = date.today() - timedelta(days=days)
    rows = (
        HealthScoreSnapshot.query
        .filter(
            HealthScoreSnapshot.user_id == user_id,
            HealthScoreSnapshot.snapshot_date >= since,
        )
        .order_by(HealthScoreSnapshot.snapshot_date.asc())
        .all()
    )
    return jsonify({"history": [
        {
            "date": r.snapshot_date.isoformat(),
            "score": r.score,
        }
        for r in rows
    ]}), 200


@app.route("/api/health-score/<int:user_id>/snapshot", methods=["POST"])
def save_health_score_snapshot(user_id):
    """Store a daily score snapshot (recompute on write)."""
    score, components = compute_health_score(user_id)
    today = date.today()
    snapshot = (
        HealthScoreSnapshot.query
        .filter_by(user_id=user_id, snapshot_date=today)
        .first()
    )
    if not snapshot:
        snapshot = HealthScoreSnapshot(
            user_id=user_id,
            snapshot_date=today,
            score=score,
            components=json.dumps(components),
        )
        db.session.add(snapshot)
    else:
        snapshot.score = score
        snapshot.components = json.dumps(components)
    db.session.commit()
    return jsonify({"message": "Snapshot saved", "score": score}), 201


# =====================================================
# GAMIFICATION
# =====================================================

def get_or_create_gamification(user_id):
    state = GamificationState.query.filter_by(user_id=user_id).first()
    if not state:
        state = GamificationState(user_id=user_id, points=0, level=1, streak=0)
        db.session.add(state)
        db.session.commit()
    return state


def award_activity_points(user_id, activity_key, points, reason):
    """Award points + bump level/streak. Returns {points, level, earned_badges}."""
    state = get_or_create_gamification(user_id)
    state.points += points
    state.level = 1 + state.points // 200

    today = date.today()
    if state.last_streak_date == today:
        pass
    elif state.last_streak_date == today - timedelta(days=1):
        state.streak += 1
    else:
        state.streak = 1
    state.last_streak_date = today
    state.updated_at = datetime.utcnow()

    earned = []
    if state.points >= 50 and not Badge.query.filter_by(
        user_id=user_id, name="First Steps"
    ).first():
        earned.append(_add_badge(user_id, "First Steps", "Earn your first 50 points on your recovery journey", "🚶"))
    if state.streak >= 3 and not Badge.query.filter_by(
        user_id=user_id, name="3-Day Streak"
    ).first():
        earned.append(_add_badge(user_id, "3-Day Streak", "Check in 3 days in a row", "🔥"))

    db.session.commit()
    return {"points": state.points, "level": state.level, "streak": state.streak, "badges": earned}


def _add_badge(user_id, name, description, icon):
    badge = Badge(user_id=user_id, name=name, description=description, icon=icon)
    db.session.add(badge)
    db.session.flush()
    return {
        "id": badge.id,
        "name": badge.name,
        "description": badge.description,
        "icon": badge.icon,
        "earned_at": badge.earned_at.isoformat() if badge.earned_at else None,
    }


@app.route("/api/gamification/<int:user_id>", methods=["GET"])
def get_gamification(user_id):
    state = get_or_create_gamification(user_id)
    badges = Badge.query.filter_by(user_id=user_id).order_by(Badge.earned_at.desc()).all()
    return jsonify({
        "points": state.points,
        "level": state.level,
        "streak": state.streak,
        "next_level_points": (state.level) * 200,
        "badges": [
            {
                "id": b.id,
                "name": b.name,
                "description": b.description,
                "icon": b.icon,
                "earned_at": b.earned_at.isoformat() if b.earned_at else None,
            }
            for b in badges
        ],
    }), 200


@app.route("/api/gamification/<int:user_id>/award", methods=["POST"])
def award_gamification_points(user_id):
    """Award points for an activity (check-in, task done, scan, activity)."""
    data = request.get_json()
    activity_key = data.get("activity")
    points = data.get("points") or 10
    reason = data.get("reason") or activity_key

    result = award_activity_points(user_id, activity_key, points, reason)
    return jsonify({"message": "Points awarded", **result}), 200


@app.route("/api/gamification/<int:user_id>/badge", methods=["POST"])
def add_badge(user_id):
    """Directly award a badge."""
    data = request.get_json()
    badge = _add_badge(
        user_id,
        data.get("name"),
        data.get("description"),
        data.get("icon", "🏅"),
    )
    db.session.commit()
    return jsonify({"message": "Badge awarded", "badge": badge}), 201


@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    """Simple points leaderboard across patients."""
    states = (
        GamificationState.query
        .order_by(GamificationState.points.desc())
        .limit(50)
        .all()
    )
    ranked = []
    for i, s in enumerate(states, start=1):
        user = User.query.get(s.user_id)
        ranked.append({
            "rank": i,
            "user_id": s.user_id,
            "name": user.name if user else f"User {s.user_id}",
            "points": s.points,
            "level": s.level,
            "streak": s.streak,
        })
    return jsonify({"leaderboard": ranked}), 200


# =====================================================
# ANALYTICS (aggregated dashboard data + charts input)
# =====================================================

@app.route("/api/analytics/<int:user_id>", methods=["GET"])
def get_analytics(user_id):
    """Aggregate data for the analytics dashboard (charts + health score).

    Always answers 200 with JSON. When the user has no health data yet
    (or an unexpected error occurs) a safe fallback payload is returned
    instead of raising, so the Health Score UI never shows
    "Failed to load health analytics".
    """
    days = request.args.get("days", 30, type=int)
    since = date.today() - timedelta(days=days)

    def _vitals_dict(record):
        if record is None:
            return None
        return {
            "id": record.id,
            "blood_sugar": record.blood_sugar,
            "heart_rate": record.heart_rate,
            "systolic": record.systolic,
            "diastolic": record.diastolic,
            "hemoglobin": record.hemoglobin,
            "recorded_at": record.recorded_at.isoformat() if record.recorded_at else None,
        }

    def _trend_label():
        """'improving' / 'declining' / 'stable' from the last two snapshots."""
        rows = (
            HealthScoreSnapshot.query
            .filter_by(user_id=user_id)
            .order_by(HealthScoreSnapshot.snapshot_date.desc())
            .limit(2)
            .all()
        )
        if len(rows) < 2:
            return "stable"
        if rows[0].score > rows[1].score:
            return "improving"
        if rows[0].score < rows[1].score:
            return "declining"
        return "stable"

    def _fallback():
        return (
            jsonify({
                "health_score": 0,
                "trend": "stable",
                "analytics": [],
                "message": "No health data available yet",
                "rangeDays": days,
                "healthScore": {"score": 0, "vitals": None},
                "taskCompletion": 0,
                "medicationAdherence": 0,
                "checkinSeries": [],
                "total_checkins": 0,
                "avg_score": None,
                "adherence_rate": None,
            }),
            200,
        )

    try:
        checkins = (
            DailyCheckin.query
            .filter(
                DailyCheckin.user_id == user_id,
                DailyCheckin.checkin_date >= since,
            )
            .order_by(DailyCheckin.checkin_date.asc())
            .all()
        )

        records = (
            HealthRecord.query
            .filter_by(user_id=user_id)
            .order_by(HealthRecord.recorded_at.desc())
            .all()
        )

        tasks_done = RecoveryTask.query.filter_by(user_id=user_id, status="done").count()
        tasks_total = RecoveryTask.query.filter_by(user_id=user_id).count()

        meds = Medicine.query.filter_by(user_id=user_id).all()
        meds_taken = sum(1 for m in meds if str(m.status).lower() in ("taken", "done"))

        if not checkins and not records and tasks_total == 0 and not meds:
            return _fallback()

        timestamps = sorted(set([c.checkin_date for c in checkins]))
        checkin_series = [
            {
                "date": d.isoformat(),
                "pain_level": next((c.pain_level for c in checkins if c.checkin_date == d), None),
                "sleep_hours": next((c.sleep_hours for c in checkins if c.checkin_date == d), None),
                "temperature": next((c.temperature for c in checkins if c.checkin_date == d), None),
                "spo2": next((c.spo2 for c in checkins if c.checkin_date == d), None),
            }
            for d in timestamps
        ]

        score = compute_health_score(user_id)[0]
        task_completion = round((tasks_done / tasks_total) * 100, 1) if tasks_total else 0
        medication_adherence = round((meds_taken / len(meds)) * 100, 1) if meds else 0

        snapshot_rows = (
            HealthScoreSnapshot.query
            .filter_by(user_id=user_id)
            .order_by(HealthScoreSnapshot.snapshot_date.desc())
            .limit(30)
            .all()
        )
        avg_score = (
            round(sum(r.score for r in snapshot_rows) / len(snapshot_rows), 1)
            if snapshot_rows else None
        )

        return jsonify({
            "health_score": score,
            "trend": _trend_label(),
            "analytics": checkin_series,
            "message": None,
            "rangeDays": days,
            "healthScore": {
                "score": score,
                "vitals": _vitals_dict(records[0] if records else None),
            },
            "taskCompletion": task_completion,
            "medicationAdherence": medication_adherence,
            "checkinSeries": checkin_series,
            "total_checkins": len(timestamps),
            "avg_score": avg_score,
            "adherence_rate": round(task_completion / 100, 3) if task_completion else 0,
        }), 200
    except Exception:
        app.logger.exception("GET /api/analytics/%s failed", user_id)
        return _fallback()


def _score_trend(user_id, days=14):
    """Weekly score trend from snapshots (kept for other callers)."""
    since = date.today() - timedelta(days=days)
    rows = (
        HealthScoreSnapshot.query
        .filter(
            HealthScoreSnapshot.user_id == user_id,
            HealthScoreSnapshot.snapshot_date >= since,
        )
        .order_by(HealthScoreSnapshot.snapshot_date.asc())
        .all()
    )
    return [
        {"date": r.snapshot_date.isoformat(), "score": r.score}
        for r in rows
    ]


# =====================================================
# DEV SEED DATA
# =====================================================

def ensure_seed_data():
    patient = User.query.filter_by(email="rani@gmail.com").first()
    if not patient:
        patient = User(
            name="Rani Kumar",
            email="rani@gmail.com",
            phone="9876543210",
            password="123456",
            role="patient",
            dob="2000-11-11",
            age="25",
            gender="Female",
            recovery_type="Medication Recovery",
            emergency_contact="9876543210",
            height=125.0,
            weight=32.0,
            blood_group="AB+",
            address="Green Park, Hyderabad",
        )
        db.session.add(patient)
        db.session.commit()

    doctor = User.query.filter_by(email="ravi@healtrack.ai").first()
    if not doctor:
        doctor = User(
            name="Dr. Ravi Verma",
            email="ravi@healtrack.ai",
            phone="9898989898",
            password="doctor123",
            role="doctor",
            medical_registration_no="MCI/2018/12345",
            specialization="Cardiology",
            hospital_clinic="City Heart Hospital",
            experience="12 years",
        )
        db.session.add(doctor)
        db.session.commit()

    caretaker = User.query.filter_by(email="asha@healtrack.ai").first()
    if not caretaker:
        caretaker = User(
            name="Asha Kapoor",
            email="asha@healtrack.ai",
            phone="9876123456",
            password="caretaker123",
            role="caretaker",
            relationship="Mother",
            patient_id=patient.id,
        )
        db.session.add(caretaker)
        db.session.commit()

    if patient.id and not DoctorPatient.query.filter_by(doctor_id=doctor.id, patient_id=patient.id).first():
        db.session.add(DoctorPatient(doctor_id=doctor.id, patient_id=patient.id))
        db.session.commit()

    # ----- Additional doctors -----
    extra_doctors = [
        {
            "name": "Dr. Meera Shah",
            "email": "meera@healtrack.ai",
            "phone": "9812345671",
            "medical_registration_no": "MCI/2016/22334",
            "specialization": "Orthopedics",
            "hospital_clinic": "Apollo Recovery Center",
            "experience": "12 years",
        },
        {
            "name": "Dr. Aditi Nair",
            "email": "aditi@healtrack.ai",
            "phone": "9812345672",
            "medical_registration_no": "MCI/2015/33445",
            "specialization": "Internal Medicine",
            "hospital_clinic": "MediWell Hospital",
            "experience": "10 years",
        },
        {
            "name": "Dr. Vikram Joshi",
            "email": "vikram@healtrack.ai",
            "phone": "9812345673",
            "medical_registration_no": "MCI/2010/44556",
            "specialization": "Neurology",
            "hospital_clinic": "Brain Care Institute",
            "experience": "15 years",
        },
    ]

    for d in extra_doctors:
        doc = User.query.filter_by(email=d["email"]).first()
        if not doc:
            doc = User(
                name=d["name"],
                email=d["email"],
                phone=d["phone"],
                password="doctor123",
                role="doctor",
                medical_registration_no=d["medical_registration_no"],
                specialization=d["specialization"],
                hospital_clinic=d["hospital_clinic"],
                experience=d["experience"],
            )
            db.session.add(doc)
            db.session.commit()

    # ----- DoctorPatient links: Rani is only connected to her assigned
    # doctor (Dr. Ravi Verma, linked above). The extra doctors remain in
    # /api/doctors for search/booking but are NOT connected, so they never
    # appear in the patient's chat doctor list. -----

    today = date.today()

    # ----- Medicines for Rani (only if none exist for today) -----
    if Medicine.query.filter_by(user_id=patient.id, date=today).count() == 0:
        meds_data = [
            {
                "name": "Aspirin 75mg",
                "dosage": "75mg",
                "frequency": "Once daily",
                "timing": "morning",
                "status": "taken",
            },
            {
                "name": "Atorvastatin 10mg",
                "dosage": "10mg",
                "frequency": "Once daily",
                "timing": "after dinner",
                "status": "pending",
            },
            {
                "name": "Metoprolol 25mg",
                "dosage": "25mg",
                "frequency": "Once daily",
                "timing": "morning",
                "status": "taken",
            },
        ]
        for m in meds_data:
            db.session.add(Medicine(
                user_id=patient.id,
                name=m["name"],
                dosage=m["dosage"],
                frequency=m["frequency"],
                timing=m["timing"],
                instruction=f"{m['dosage']} • {m['timing']}",
                status=m["status"],
                date=today,
            ))
        db.session.commit()

    # ----- Recovery tasks for Rani (only if none exist for today) -----
    if RecoveryTask.query.filter_by(user_id=patient.id, date=today).count() == 0:
        tasks_data = [
            {"name": "Morning stretch 15 min", "tag": "Exercise", "status": "done"},
            {"name": "Take Vitamin D", "tag": "Medicine", "status": "pending"},
            {"name": "Evening walk 20 min", "tag": "Exercise", "status": "pending"},
            {"name": "How are you feeling today?", "tag": "Check-in", "status": "pending"},
        ]
        for t in tasks_data:
            db.session.add(RecoveryTask(
                user_id=patient.id,
                date=today,
                name=t["name"],
                tag=t["tag"],
                status=t["status"],
            ))
        db.session.commit()

    # ----- Daily activities for Rani (only if none exist for today) -----
    if DailyActivity.query.filter_by(user_id=patient.id, date=today).count() == 0:
        activities_data = [
            {"name": "Morning Walk", "duration": 15, "status": "done"},
            {"name": "Breathing Exercise", "duration": 10, "status": "done"},
            {"name": "Stretching", "duration": 10, "status": "pending"},
        ]
        for act in activities_data:
            db.session.add(DailyActivity(
                user_id=patient.id,
                date=today,
                name=act["name"],
                duration=act["duration"],
                status=act["status"],
            ))
        db.session.commit()

    # ----- Appointments for Rani (only if none exist) -----
    if Appointment.query.filter_by(user_id=patient.id).count() == 0:
        cardiology_appt = Appointment(
            user_id=patient.id,
            title="Cardiology Follow-up",
            subtitle="Follow-up with cardiologist",
            date=today + timedelta(days=1),
            time="10:30 AM",
            status="Upcoming",
            doctor_name=doctor.name,
            doctor_id=doctor.id,
            department="Cardiology",
            location="City Heart Hospital",
            appointment_type="Check-up",
        )
        general_appt = Appointment(
            user_id=patient.id,
            title="General Checkup",
            subtitle="Routine general checkup",
            date=today + timedelta(days=7),
            time="02:00 PM",
            status="Scheduled",
            department="General Medicine",
            location="City Heart Hospital",
            appointment_type="Check-up",
        )
        db.session.add(cardiology_appt)
        db.session.add(general_appt)
        db.session.commit()

    # ----- Health record for Rani (only if none exist) -----
    if HealthRecord.query.filter_by(user_id=patient.id).count() == 0:
        db.session.add(HealthRecord(
            user_id=patient.id,
            blood_sugar=118,
            heart_rate=76,
            systolic=118,
            diastolic=78,
            hemoglobin=12.6,
        ))
        db.session.commit()

    # ----- Alert for Rani (only if none exist) -----
    if Alert.query.filter_by(user_id=patient.id).count() == 0:
        db.session.add(Alert(
            user_id=patient.id,
            type="warning",
            title="Medicine Reminder",
            message="Take your afternoon medicine on time.",
        ))
        db.session.commit()

    # ----- Alert for the doctor about patient -----
    if not Alert.query.filter_by(
        user_id=doctor.id,
        title="Patient Check-in",
    ).first():
        db.session.add(Alert(
            user_id=doctor.id,
            type="info",
            title="Patient Check-in",
            message="Rani Kumar completed her daily check-in.",
        ))
        db.session.commit()

    # ----- Phase-2: Medication interaction rules (idempotent) -----
    _seed_interaction_rules()


# =====================================================
# Phase-1.5: Patient <-> Doctor Chat
# =====================================================
# REST-first (you specified "no WebSocket yet"): the client
# polls GET /api/chat/thread every 5 seconds for live updates.
# No SocketIO, no SSE. Each Message row = one chat message;
# a thread is the implicit (sender_id, receiver_id) pair.

def _user_quick(user):
    return {
        "id": user.id,
        "name": user.name,
        "role": user.role
    }


def _chat_deadlock_safe(*args):
    """Return a fresh session in case an earlier rollback poisoned it."""
    db.session.rollback()
    return db.session


@app.route("/api/chat/send", methods=["POST"])
def send_chat_message():
    data = request.get_json(silent=True) or {}

    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    message = (data.get("message") or "").strip()

    if not sender_id or not receiver_id:
        return jsonify({"message": "sender_id and receiver_id are required"}), 400

    if not message:
        return jsonify({"message": "Message cannot be empty"}), 400

    sender = db.session.get(User, sender_id)
    receiver = db.session.get(User, receiver_id)

    if sender is None or receiver is None:
        return jsonify({"message": "Sender or receiver not found"}), 404

    if sender_id == receiver_id:
        return jsonify({"message": "Cannot message yourself"}), 400

    if sender.role not in ("patient", "doctor", "admin") or receiver.role not in (
        "patient",
        "doctor",
        "admin",
    ):
        return jsonify({"message": "Only patients and doctors can chat"}), 403

    # OPTIONAL guard: doctor/patient must be linked (DoctorPatient).
    # Kept soft so a brand-new pair isn't hard-blocked during seeding.
    linked = (
        DoctorPatient.query.filter(
            db.or_(
                db.and_(
                    DoctorPatient.doctor_id == receiver_id,
                    DoctorPatient.patient_id == sender_id,
                ),
                db.and_(
                    DoctorPatient.doctor_id == sender_id,
                    DoctorPatient.patient_id == receiver_id,
                ),
            )
        ).first()
    )
    if linked is None:
        return jsonify({"message": "Doctor and patient are not connected"}), 403

    msg = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message,
    )
    db.session.add(msg)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Message sent",
                "id": msg.id,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            }
        ),
        201,
    )


@app.route("/api/chat/thread/<int:user1>/<int:user2>", methods=["GET"])
def get_chat_thread(user1, user2):
    thread = (
        Message.query.filter(
            db.or_(
                db.and_(Message.sender_id == user1, Message.receiver_id == user2),
                db.and_(Message.sender_id == user2, Message.receiver_id == user1),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    return (
        jsonify(
            {
                "thread": [
                    {
                        "id": m.id,
                        "sender_id": m.sender_id,
                        "receiver_id": m.receiver_id,
                        "message": m.message,
                        "read_at": m.read_at.isoformat() if m.read_at else None,
                        "created_at": (
                            m.created_at.isoformat() if m.created_at else None
                        ),
                    }
                    for m in thread
                ]
            }
        ),
        200,
    )


@app.route("/api/chat/conversations/<int:user_id>", methods=["GET"])
def get_chat_conversations(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"message": "User not found"}), 404

    # All parties this user has ever talked to, plus every DoctorPatient
    # link, so brand-new connected pairs appear even with zero messages.
    counterpart_ids = set()

    if user.role == "patient":
        # Patients only ever see doctors they are linked to (DoctorPatient).
        # Message-history peers that are NOT connected doctors are excluded,
        # so unconnected doctors never appear in the patient's chat list.
        linked = DoctorPatient.query.filter_by(patient_id=user_id).all()
        counterpart_ids = {link.doctor_id for link in linked}
    else:
        linked = DoctorPatient.query.filter(
            db.or_(
                DoctorPatient.doctor_id == user_id,
                DoctorPatient.patient_id == user_id,
            )
        ).all()
        for link in linked:
            counterpart_ids.add(
                link.patient_id if link.doctor_id == user_id else link.doctor_id
            )

        sent = Message.query.filter_by(sender_id=user_id).all()
        for m in sent:
            counterpart_ids.add(m.receiver_id)
        received = Message.query.filter_by(receiver_id=user_id).all()
        for m in received:
            counterpart_ids.add(m.sender_id)

    conversations = []
    for pid in counterpart_ids:
        peer = db.session.get(User, pid)
        if peer is None:
            continue

        # Belt-and-braces: a patient's list must only contain doctors.
        if user.role == "patient" and peer.role != "doctor":
            continue

        last_message = (
            Message.query.filter(
                db.or_(
                    db.and_(
                        Message.sender_id == user_id,
                        Message.receiver_id == pid,
                    ),
                    db.and_(
                        Message.sender_id == pid,
                        Message.receiver_id == user_id,
                    ),
                )
            )
            .order_by(Message.created_at.desc())
            .first()
        )

        unread = (
            Message.query.filter(
                db.and_(
                    Message.receiver_id == user_id,
                    Message.sender_id == pid,
                    Message.read_at.is_(None),
                )
            ).count()
        )

        conversations.append(
            {
                "peer_id": peer.id,
                "peer_name": peer.name,
                "peer_role": peer.role,
                "last_message": last_message.message if last_message else None,
                "last_message_at": (
                    last_message.created_at.isoformat()
                    if last_message and last_message.created_at
                    else None
                ),
                "unread_count": unread,
            }
        )

    # Peer id descending keeps the most recently touched pair near the top.
    conversations.sort(key=lambda c: c["unread_count"], reverse=True)

    return jsonify({"conversations": conversations}), 200


@app.route("/api/chat/read/<int:message_id>", methods=["PUT"])
def mark_chat_read(message_id):
    data = request.get_json(silent=True) or {}
    reader_id = data.get("reader_id")

    msg = db.session.get(Message, message_id)
    if msg is None:
        return jsonify({"message": "Message not found"}), 404

    if reader_id is None or int(reader_id) != msg.receiver_id:
        return jsonify({"message": "Only the receiver can mark as read"}), 403

    if msg.read_at is None:
        msg.read_at = db.func.now()
        db.session.commit()

    return (
        jsonify(
            {
                "message": "Marked as read",
                "id": msg.id,
                "read_at": msg.read_at.isoformat() if msg.read_at else None,
            }
        ),
        200,
    )


# =====================================================
# AI CARE ASSISTANT
# =====================================================
# No external LLM key is configured in this environment, so the assistant
# answers from the user's real health data (health score, medications,
# appointments, recovery progress, vitals and alerts). The route always
# returns 200 with {"reply": "..."} so the chat UI never fails.


def _ai_care_context(user_id):
    """Pull live health context for the assistant's replies."""
    user = db.session.get(User, user_id)
    today = date.today()

    meds = (
        Medicine.query
        .filter_by(user_id=user_id, date=today)
        .order_by(Medicine.id.asc())
        .all()
    )
    meds_taken = [m for m in meds if str(m.status).lower() == "taken"]
    meds_pending = [m for m in meds if str(m.status).lower() in ("pending", "missed")]
    all_meds = (
        Medicine.query
        .filter_by(user_id=user_id)
        .order_by(Medicine.date.desc(), Medicine.id.desc())
        .limit(6)
        .all()
    )

    appointments = (
        Appointment.query
        .filter_by(user_id=user_id)
        .filter(Appointment.date >= today)
        .order_by(Appointment.date.asc(), Appointment.time.asc())
        .all()
    )

    tasks = RecoveryTask.query.filter_by(user_id=user_id).all()
    tasks_done = sum(1 for t in tasks if str(t.status).lower() == "done")
    tasks_total = len(tasks)

    plans = (
        RecoveryPlan.query
        .filter_by(patient_id=user_id)
        .order_by(RecoveryPlan.start_date.desc())
        .all()
    )

    alerts = (
        Alert.query
        .filter_by(user_id=user_id)
        .order_by(Alert.created_at.desc())
        .limit(5)
        .all()
    )
    unread_alerts = sum(1 for a in alerts if not a.is_read)

    latest_vitals = (
        HealthRecord.query
        .filter_by(user_id=user_id)
        .order_by(HealthRecord.recorded_at.desc())
        .first()
    )

    score, components = compute_health_score(user_id)

    return {
        "user": user,
        "score": score,
        "components": components,
        "meds": meds,
        "meds_taken": len(meds_taken),
        "meds_pending": len(meds_pending),
        "meds_names": [m.name for m in meds_pending][:5],
        "all_meds": all_meds,
        "appointments": appointments[:4],
        "appointments_count": len(appointments),
        "tasks_done": tasks_done,
        "tasks_total": tasks_total,
        "plans": plans,
        "alerts_count": len(alerts),
        "unread_alerts": unread_alerts,
        "alerts": alerts,
        "latest_vitals": latest_vitals,
        "today": today,
    }


def _ai_summary_line(ctx):
    parts = []
    parts.append("Overall health score: %d/100" % ctx["score"])
    if ctx["meds_pending"]:
        parts.append("%d medicine(s) still pending today" % ctx["meds_pending"])
    else:
        parts.append("your medicines are marked taken today")
    if ctx["tasks_total"]:
        parts.append(
            "recovery tasks: %d/%d done"
            % (ctx["tasks_done"], ctx["tasks_total"])
        )
    if ctx["appointments_count"]:
        first = ctx["appointments"][0]
        parts.append(
            "next appointment: %s on %s"
            % (first.title or "Visit", first.date.isoformat())
        )
    return " | ".join(parts)


def _fmt_med(m):
    dose = m.dosage and " %s" % m.dosage or ""
    when = m.timing and " (%s)" % m.timing or ""
    status = str(m.status or "pending").capitalize()
    return "%s%s%s — %s" % (m.name, dose, when, status)


def _ai_care_reply(user_id, message):
    """Return a human-readable reply built from real user data."""
    msg = message.lower()
    user = db.session.get(User, user_id)

    if user is None:
        return (
            "I couldn't find your user account. Please log in again and try once more."
        )

    if not msg:
        return (
            "Hi %s! Ask me about your health score, medicines, "
            "appointments, or recovery progress." % (user.name or "there")
        )

    ctx = _ai_care_context(user_id)
    name = (user.name or "").split(" ")[0] or "there"

    # Greetings
    if any(w in msg for w in ("hi", "hello", "hey", "good morning", "good evening")):
        return (
            "Hello %s! %s. What would you like to know — your health score, "
            "medicines, appointments, or recovery progress?"
            % (name, _ai_summary_line(ctx))
        )

    # Health score / wellness
    if any(w in msg for w in ("health score", "my score", "wellness", "how am i doing", "overall health")):
        comp = ctx["components"]
        lines = [
            "Your current health score is %d/100." % ctx["score"],
        ]
        label = {
            "vitals": "vitals",
            "checkin_streak": "check-in streak",
            "tasks": "recovery tasks",
        }
        for key in ("vitals", "checkin_streak", "tasks"):
            if key in comp:
                lines.append("- %s: %s/15" % (label[key], comp[key]))
        if ctx["score"] >= 80:
            lines.append("You're in good shape — keep it up.")
        elif ctx["score"] >= 55:
            lines.append("Progress is steady. A few pending items are pulling the score down.")
        else:
            lines.append("Your score needs attention. Review today's checklist and consult your care team if needed.")
        return "\n".join(lines)

    # Medicines
    if any(w in msg for w in ("medicin", "medicine", "meds", "tablet", "pill", "dose", "drug")):
        pending = ctx["meds"]
        if pending:
            lines = [
                "Today's medicines (%d):" % len(pending),
            ]
            lines += ["- %s" % _fmt_med(m) for m in pending]
            if ctx["meds_pending"]:
                lines.append("Pending: %d dose(s) to still take today." % ctx["meds_pending"])
            return "\n".join(lines)
        if ctx["all_meds"]:
            latest = "\n".join("- %s" % _fmt_med(m) for m in ctx["all_meds"][:5])
            return (
                "No medicines scheduled for today. Your recent medication list:\n%s"
                % latest
            )
        return (
            "You don't have any medicines on record yet. Add your prescriptions "
            "from the Medicines page and I'll remind you of pending doses."
        )

    # Appointments
    if any(w in msg for w in ("appointment", "doctor visit", "schedule", "booking", "consult")):
        apts = ctx["appointments"]
        if not apts:
            return (
                "You have no upcoming appointments. You can book one from the "
                "Appointments page or Find a Doctor."
            )
        lines = ["Upcoming appointments (%d):" % ctx["appointments_count"]]
        for a in apts:
            lines.append(
                "- %s on %s%s%s"
                % (
                    a.title or "Visit",
                    a.date.isoformat(),
                    (" at %s" % a.time) if a.time else "",
                    (" (%s)" % a.status) if a.status else "",
                )
            )
        return "\n".join(lines)

    # Recovery progress / tasks / plans
    if any(w in msg for w in ("recover", "progress", "task", "plan")):
        lines = []
        if ctx["tasks_total"]:
            pct = int(round((ctx["tasks_done"] / ctx["tasks_total"]) * 100))
            lines.append(
                "Recovery tasks: %d/%d done (%d%%)."
                % (ctx["tasks_done"], ctx["tasks_total"], pct)
            )
            if ctx["tasks_total"] == ctx["tasks_done"]:
                lines.append("All today's recovery activities are complete. Great work!")
            else:
                lines.append("Keep going — each completed task improves your health score.")
        else:
            lines.append(
                "No recovery tasks on record yet. Your recovery type: %s."
                % (user.recovery_type or "General")
            )
        if ctx["plans"]:
            plan = ctx["plans"][0]
            lines.append(
                "Active recovery plan: %s%s"
                % (
                    plan.title,
                    (" (%s to %s)" % (plan.start_date, plan.end_date))
                    if plan.start_date and plan.end_date
                    else "",
                )
            )
        return "\n".join(lines)

    # Vitals
    if any(w in msg for w in ("vital", "bp", "blood", "glucose", "sugar", "heart rate", "pulse", "hemoglobin", "pressure")):
        v = ctx["latest_vitals"]
        if v is None:
            return (
                "I don't have any recent vitals for you yet. Upload a health "
                "record or check in to start tracking them."
            )
        status = {}
        for field in ("blood_sugar", "heart_rate", "systolic", "diastolic", "hemoglobin"):
            status[field] = get_status(field, getattr(v, field))
        lines = ["Your latest vitals:"]
        labels = {
            "blood_sugar": "Blood sugar",
            "heart_rate": "Heart rate",
            "systolic": "Systolic BP",
            "diastolic": "Diastolic BP",
            "hemoglobin": "Hemoglobin",
        }
        abnormal = 0
        for field in ("blood_sugar", "heart_rate", "systolic", "diastolic", "hemoglobin"):
            value = getattr(v, field)
            value_text = (
                "%s" % value
                if value is not None
                else "n/a"
            )
            flag = status[field] or "normal"
            if flag not in ("normal", None):
                abnormal += 1
            lines.append("- %s: %s (%s)" % (labels[field], value_text, flag))
        if abnormal:
            lines.append("Some readings are outside the normal range. Please review them with your doctor.")
        else:
            lines.append("All readings are within normal range.")
        return "\n".join(lines)

    # Alerts
    if any(w in msg for w in ("alert", "warning", "notification", "remind")):
        if not ctx["alerts"]:
            return "You have no alerts right now. Everything looks quiet."
        lines = ["Recent alerts (%d unread):" % ctx["unread_alerts"]]
        for a in ctx["alerts"]:
            lines.append("- %s: %s" % (a.title or "Alert", a.message or ""))
        return "\n".join(lines)

    # Diet / exercise / advice
    if any(w in msg for w in ("diet", "exercise", "advice", "healthy", "sleep", "suggest")):
        return (
            "Here's some general advice based on your current state:\n"
            "- Keep your medicines on schedule; taking them on time is the "
            "biggest contributor to recovery.\n"
            "- Complete today's recovery tasks to keep your health score "
            "climbing.\n"
            "- Stay hydrated and get 7-8 hours of sleep.\n"
            "Your current health score is %d/100 (%s)."
            % (
                ctx["score"],
                "looking good"
                if ctx["score"] >= 70
                else "a little room to improve",
            )
        )

    # Fallback — always give a useful, data-backed answer
    return (
        "Here's a snapshot of your health right now:\n"
        "%s.\n\n"
        "You can ask me about: your health score, today's medicines, "
        "appointments, recovery progress, latest vitals, or recent alerts."
        % _ai_summary_line(ctx)
    )


@app.route("/api/chat/ai", methods=["POST"])
def ai_care_assistant():
    """AI Care Assistant chat endpoint.

    No Gemini/OpenAI key is configured in this environment, so replies are
    built locally from the user's real health data. Always responds 200 with
    {"reply": "..."} so the frontend chat never shows a failure message.
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("userId") or data.get("user_id")
    message = str(data.get("message") or "").strip()

    if not user_id:
        return jsonify({
            "reply": "I need a user account to help. Please log in and try again.",
            "source": "fallback",
        }), 200

    try:
        reply = _ai_care_reply(int(user_id), message)
    except Exception:
        app.logger.exception("AI Care Assistant failed for user %s", user_id)
        reply = (
            "I ran into a small issue pulling your health data. "
            "Please try again in a moment."
        )

    return jsonify({"reply": reply, "source": "fallback"}), 200


# =====================================================
# Phase-2: RECOVERY MILESTONES
# =====================================================

MILESTONE_STATUSES = ("pending", "in_progress", "completed")


def _serialize_milestone(m):
    doctor = User.query.get(m.doctor_id) if m.doctor_id else None
    return {
        "id": m.id,
        "patient_id": m.patient_id,
        "doctor_id": m.doctor_id,
        "doctor_name": doctor.name if doctor else None,
        "title": m.title,
        "description": m.description,
        "category": m.category or "General",
        "due_date": m.due_date.isoformat() if m.due_date else None,
        "status": m.status,
        "order_index": m.order_index,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@app.route("/api/milestones/patient/<int:patient_id>", methods=["GET"])
def get_patient_milestones(patient_id):
    """Timeline for a patient, oldest expectations first."""
    milestones = (
        RecoveryMilestone.query
        .filter_by(patient_id=patient_id)
        .order_by(
            RecoveryMilestone.order_index.asc(),
            RecoveryMilestone.id.asc(),
        )
        .all()
    )
    return jsonify({
        "milestones": [_serialize_milestone(m) for m in milestones],
        "counts": {
            "total": len(milestones),
            "in_progress": len([m for m in milestones if m.status == "in_progress"]),
            "completed": len([m for m in milestones if m.status == "completed"]),
        },
    }), 200


@app.route("/api/milestones/doctor/<int:doctor_id>", methods=["GET"])
def get_doctor_milestones(doctor_id):
    """All milestones created by a doctor (across their patients)."""
    milestones = (
        RecoveryMilestone.query
        .filter_by(doctor_id=doctor_id)
        .order_by(RecoveryMilestone.created_at.desc())
        .all()
    )
    result = []
    for m in milestones:
        row = _serialize_milestone(m)
        patient = User.query.get(m.patient_id)
        row["patient_name"] = patient.name if patient else None
        result.append(row)
    return jsonify({"milestones": result}), 200


@app.route("/api/milestones", methods=["POST"])
def create_milestone():
    """Doctor creates a milestone for a patient."""
    data = request.get_json(silent=True) or {}

    patient_id = data.get("patient_id")
    title = (data.get("title") or "").strip()
    if not patient_id or not title:
        return jsonify({"message": "patient_id and title are required"}), 400

    patient = User.query.filter_by(id=patient_id, role="patient").first()
    if not patient:
        return jsonify({"message": "Patient not found"}), 404

    milestone = RecoveryMilestone(
        patient_id=patient_id,
        doctor_id=data.get("doctor_id"),
        title=title,
        description=data.get("description"),
        category=data.get("category"),
        due_date=parse_date_or_none(data.get("due_date")),
        status=data.get("status", "pending"),
        order_index=data.get("order_index", 0),
    )
    db.session.add(milestone)
    db.session.commit()

    create_alert_if_not_exists(
        patient_id, "info", "New Recovery Milestone",
        f"Your doctor added a recovery milestone: {milestone.title}",
    )

    return jsonify({
        "message": "Milestone created",
        "milestone": _serialize_milestone(milestone),
    }), 201


@app.route("/api/milestones/<int:milestone_id>", methods=["PUT"])
def update_milestone(milestone_id):
    """Patient/doctor updates milestone fields or status."""
    milestone = RecoveryMilestone.query.get_or_404(milestone_id)
    data = request.get_json(silent=True) or {}

    if "status" in data and data["status"] in MILESTONE_STATUSES:
        milestone.status = data["status"]
    if "title" in data:
        milestone.title = data["title"]
    if "description" in data:
        milestone.description = data["description"]
    if "category" in data:
        milestone.category = data["category"]
    if "due_date" in data:
        milestone.due_date = parse_date_or_none(data["due_date"])
    if "order_index" in data:
        milestone.order_index = data["order_index"]

    db.session.commit()

    if milestone.status == "completed":
        create_alert_if_not_exists(
            milestone.patient_id, "success", "Milestone Completed",
            f"You completed the milestone: {milestone.title}",
        )

    return jsonify({
        "message": "Milestone updated",
        "milestone": _serialize_milestone(milestone),
    }), 200


@app.route("/api/milestones/<int:milestone_id>", methods=["DELETE"])
def delete_milestone(milestone_id):
    milestone = RecoveryMilestone.query.get_or_404(milestone_id)
    db.session.delete(milestone)
    db.session.commit()
    return jsonify({"message": "Milestone deleted"}), 200


# =====================================================
# Phase-2: HEALTH JOURNAL
# =====================================================

def _serialize_journal(j):
    return {
        "id": j.id,
        "user_id": j.user_id,
        "date": j.entry_date.isoformat(),
        "mood": j.mood,
        "mood_score": j.mood_score,
        "sleep_hours": j.sleep_hours,
        "symptoms": j.symptoms,
        "notes": j.notes,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    }


def parse_date_or_none(value):
    if not value:
        return None
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


@app.route("/api/journal/<int:user_id>", methods=["GET"])
def get_journal_entries(user_id):
    limit = request.args.get("limit", 0, type=int)
    query = (
        HealthJournal.query
        .filter_by(user_id=user_id)
        .order_by(HealthJournal.entry_date.desc())
    )
    entries = query.limit(limit).all() if limit else query.limit(60).all()
    return jsonify({"entries": [_serialize_journal(j) for j in entries]}), 200


@app.route("/api/journal/<int:user_id>/<entry_date>", methods=["GET"])
def get_journal_entry(user_id, entry_date):
    entry = HealthJournal.query.filter_by(
        user_id=user_id,
        entry_date=parse_date_or_none(entry_date),
    ).first()
    if not entry:
        return jsonify({"message": "No journal entry for this date", "entry": None}), 200
    return jsonify({"entry": _serialize_journal(entry)}), 200


@app.route("/api/journal", methods=["POST"])
def save_journal_entry():
    """Create or patch the journal entry for a given date (upsert)."""
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400

    entry_date = parse_date_or_none(data.get("date") or date.today().isoformat())
    if not entry_date:
        return jsonify({"message": "Invalid date format"}), 400

    entry = HealthJournal.query.filter_by(
        user_id=user_id,
        entry_date=entry_date,
    ).first()
    if not entry:
        entry = HealthJournal(user_id=user_id, entry_date=entry_date)
        db.session.add(entry)

    if "mood" in data:
        entry.mood = data["mood"]
    if "mood_score" in data:
        entry.mood_score = data["mood_score"]
    if "sleep_hours" in data:
        entry.sleep_hours = data["sleep_hours"]
    if "symptoms" in data:
        entry.symptoms = data["symptoms"]
    if "notes" in data:
        entry.notes = data["notes"]

    db.session.commit()
    return jsonify({
        "message": "Journal saved successfully",
        "saved": True,
        "entry": _serialize_journal(entry),
    }), 201


# =====================================================
# Phase-2: MEDICATION INTERACTION CHECKER (independent)
# =====================================================

def _normalize_med(name):
    if not name:
        return ""
    return re.sub(r"\s+", " ", str(name)).strip().lower()


def _seed_interaction_rules():
    """Seed a small built-in interaction database (idempotent)."""
    rules = [
        ("Warfarin", "Aspirin", "severe",
         "Combining warfarin with aspirin increases the risk of serious bleeding.",
         "Avoid this combination unless explicitly prescribed. Monitor INR closely."),
        ("Warfarin", "Ibuprofen", "severe",
         "NSAIDs alongside warfarin can cause dangerous GI bleeding.",
         "Avoid NSAIDs while on warfarin; use paracetamol for pain."),
        ("Aspirin", "Ibuprofen", "moderate",
         "Ibuprofen may reduce the blood-thinning effect of aspirin and irritate the stomach.",
         "Take aspirin before ibuprofen and separate doses by at least 2 hours."),
        ("Metoprolol", "Verapamil", "severe",
         "Both slow the heart rate; combined use can cause bradycardia or heart block.",
         "Avoid concurrent use. Notify your doctor immediately."),
        ("Metoprolol", "Diltiazem", "severe",
         "Risk of excessive slowing of the heart and low blood pressure.",
         "Avoid combining. Emergency care if dizziness or fainting occurs."),
        ("Metoprolol", "Warfarin", "mild",
         "No major interaction, but heart-rate swings may affect INR monitoring.",
         "Monitor heart rate and follow regular INR tests."),
        ("Atorvastatin", "Clarithromycin", "severe",
         "Clarithromycin strongly raises atorvastatin levels, risking muscle damage.",
         "Avoid; if required, use an alternative antibiotic."),
        ("Atorvastatin", "Verapamil", "moderate",
         "May increase statin levels and muscle side effects.",
         "Use the lowest statin dose and watch for muscle pain."),
        ("Atorvastatin", "Fluconazole", "moderate",
         "May raise atorvastatin levels and increase myopathy risk.",
         "Monitor for muscle aches; temporally separate doses."),
        ("Metformin", "Ibuprofen", "mild",
         "High-dose NSAIDs may slightly reduce kidney function and affect metformin.",
         "Stay hydrated and check kidney function regularly."),
        ("Warfarin", "Paracetamol", "mild",
         "Regular paracetamol can slightly raise INR.",
         "Keep paracetamol use consistent and monitor INR."),
        ("Digoxin", "Furosemide", "moderate",
         "Low potassium from diuretics increases digoxin toxicity risk.",
         "Monitor potassium and digoxin levels together."),
        ("Digoxin", "Verapamil", "severe",
         "Verapamil raises digoxin levels and can cause toxicity.",
         "Reduce digoxin dose and monitor closely."),
        ("Omeprazole", "Clopidogrel", "moderate",
         "May reduce clopidogrel activation and its antiplatelet effect.",
         "Consider an H2 blocker instead of a PPI."),
        ("Sildenafil", "Nitroglycerin", "severe",
         "Severe, potentially life-threatening drop in blood pressure.",
         "Never combine within 24-48 hours of each other."),
        ("Levothyroxine", "Calcium", "mild",
         "Calcium reduces absorption of levothyroxine.",
         "Separate doses by at least 4 hours."),
    ]
    if MedicineInteractionRule.query.count() > 0:
        return
    for a, b, severity, warning, recommendation in rules:
        db.session.add(MedicineInteractionRule(
            medicine_a=a,
            medicine_b=b,
            severity=severity,
            warning=warning,
            recommendation=recommendation,
        ))
    db.session.commit()


@app.route("/api/interactions/rules", methods=["GET"])
def get_interaction_rules():
    rules = MedicineInteractionRule.query.all()
    return jsonify({
        "rules": [
            {
                "id": r.id,
                "medicine_a": r.medicine_a,
                "medicine_b": r.medicine_b,
                "severity": r.severity,
                "warning": r.warning,
                "recommendation": r.recommendation,
            }
            for r in rules
        ]
    }), 200


@app.route("/api/interactions/rules", methods=["POST"])
def add_interaction_rule():
    data = request.get_json(silent=True) or {}
    a = _normalize_med(data.get("medicine_a"))
    b = _normalize_med(data.get("medicine_b"))
    if not a or not b:
        return jsonify({"message": "medicine_a and medicine_b are required"}), 400
    rule = MedicineInteractionRule(
        medicine_a=data["medicine_a"],
        medicine_b=data["medicine_b"],
        severity=data.get("severity", "moderate"),
        warning=data.get("warning"),
        recommendation=data.get("recommendation"),
    )
    db.session.add(rule)
    db.session.commit()
    return jsonify({
        "message": "Interaction rule added",
        "rule": {
            "id": rule.id,
            "medicine_a": rule.medicine_a,
            "medicine_b": rule.medicine_b,
            "severity": rule.severity,
            "warning": rule.warning,
            "recommendation": rule.recommendation,
        },
    }), 201


@app.route("/api/interactions/check", methods=["POST"])
def check_medication_interactions():
    """Check a list of medicine names for risky combinations.

    Fully independent of the Medicine table — the caller supplies names.
    Creates an Alert for the user when a severe interaction is found.
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    names = data.get("medicines") or []

    if not isinstance(names, list) or len(names) < 2:
        return jsonify({"message": "Provide at least two medicine names"}), 400

    norm_map = {}
    for n in names:
        key = _normalize_med(n)
        if key:
            norm_map.setdefault(key, str(n).strip())

    unique_keys = list(norm_map.keys())
    rules = MedicineInteractionRule.query.all()

    findings = []
    matched = set()
    for rule in rules:
        ka = _normalize_med(rule.medicine_a)
        kb = _normalize_med(rule.medicine_b)
        if ka in unique_keys and kb in unique_keys:
            findings.append({
                "medicine_a": norm_map[ka],
                "medicine_b": norm_map[kb],
                "severity": rule.severity,
                "warning": rule.warning,
                "recommendation": rule.recommendation,
            })
            matched.add(ka)
            matched.add(kb)

    severity_counts = {"mild": 0, "moderate": 0, "severe": 0}
    for f in findings:
        severity_counts[f["severity"]] = severity_counts.get(f["severity"], 0) + 1

    severe = [f for f in findings if f["severity"] == "severe"]
    if user_id and severe:
        pairs = ", ".join(f"{f['medicine_a']} + {f['medicine_b']}" for f in severe[:3])
        create_alert_if_not_exists(
            user_id, "warning", "Risky Medication Combination",
            f"Severe interaction detected between: {pairs}. Consult your doctor.",
        )

    checked = [norm_map[k] for k in unique_keys]
    safe = [n for n in checked if _normalize_med(n) not in matched]

    return jsonify({
        "check": True,
        "checked": checked,
        "findings": findings,
        "severity_counts": severity_counts,
        "safe": safe,
        "has_issues": len(findings) > 0,
    }), 200


# =====================================================
# Phase-5: SMART HEALTH MONITORING (wearable simulator)
# =====================================================
# Fully simulated — no external hardware, no background threads.
# Readings are lazily generated on each poll whenever the per-user
# simulator is "running" and the interval has elapsed. Abnormal
# vitals push an Alert row (source='wearable') via the existing
# same-day-dedupe helper.

WEARABLE_HEART_HIGH = 120
WEARABLE_HEART_LOW = 50
WEARABLE_SPO2_LOW = 92


def _wearable_baseline(user):
    """Baseline heart rate roughly derived from the user's age."""
    baseline = 72
    if user and user.age:
        try:
            age = int(str(user.age))
            baseline = max(60, min(85, 70 + age // 15))
        except (TypeError, ValueError):
            pass
    return baseline


def get_or_create_wearable_simulator(user_id):
    sim = WearableSimulator.query.filter_by(user_id=user_id).first()
    if not sim:
        sim = WearableSimulator(
            user_id=user_id,
            running=True,
            interval_seconds=3,
            last_steps=0,
            step_date=date.today(),
        )
        db.session.add(sim)
        db.session.commit()
    return sim


def _serialize_wearable_reading(r):
    return {
        "id": r.id,
        "user_id": r.user_id,
        "device": r.device,
        "heart_rate": r.heart_rate,
        "spo2": r.spo2,
        "steps": r.steps,
        "sleep_hours": r.sleep_hours,
        "sleep_quality": r.sleep_quality,
        "activity_level": r.activity_level,
        "calories": r.calories,
        "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
        "status": {
            "heart_rate": "high" if r.heart_rate and r.heart_rate > WEARABLE_HEART_HIGH
                           else ("low" if r.heart_rate and r.heart_rate < WEARABLE_HEART_LOW else "normal"),
            "spo2": "low" if r.spo2 is not None and r.spo2 < WEARABLE_SPO2_LOW else "normal",
        },
    }


def _eval_wearable_vitals(user_id, r):
    """Create (deduped) warning alerts for abnormal simulated vitals."""
    if r.heart_rate is not None and r.heart_rate > WEARABLE_HEART_HIGH:
        create_alert_if_not_exists(
            user_id, "warning", "High Heart Rate",
            f"Simulated heart rate {r.heart_rate:.0f} BPM exceeds {WEARABLE_HEART_HIGH}.",
            source="wearable"
        )
    elif r.heart_rate is not None and r.heart_rate < WEARABLE_HEART_LOW:
        create_alert_if_not_exists(
            user_id, "warning", "Low Heart Rate",
            f"Simulated heart rate {r.heart_rate:.0f} BPM is below {WEARABLE_HEART_LOW}.",
            source="wearable"
        )
    if r.spo2 is not None and r.spo2 < WEARABLE_SPO2_LOW:
        create_alert_if_not_exists(
            user_id, "warning", "Low Blood Oxygen",
            f"Simulated SpO2 {r.spo2:.0f}% is below the safe {WEARABLE_SPO2_LOW}% threshold.",
            source="wearable"
        )


def generate_wearable_reading(user_id, force=False):
    """Produce one synthetic reading (respects interval unless forced)."""
    sim = get_or_create_wearable_simulator(user_id)
    now = datetime.utcnow()

    latest = (
        WearableReading.query
        .filter_by(user_id=user_id)
        .order_by(WearableReading.recorded_at.desc())
        .first()
    )
    if latest and not force:
        elapsed = (now - latest.recorded_at).total_seconds()
        if elapsed < sim.interval_seconds:
            return latest, None

    user = User.query.get(user_id)
    baseline = _wearable_baseline(user)

    heart_rate = baseline + random.randint(-6, 6)
    if random.random() < 0.12:
        heart_rate = random.choice([random.randint(38, 49), random.randint(121, 140)])

    spo2 = random.randint(96, 99)
    if random.random() < 0.10:
        spo2 = random.randint(88, 91)

    if sim.step_date != date.today():
        sim.step_date = date.today()
        sim.last_steps = random.randint(200, 900)
    sim.last_steps += random.randint(30, 250)

    reading = WearableReading(
        user_id=user_id,
        device="HealTrack Band",
        heart_rate=heart_rate,
        spo2=spo2,
        steps=sim.last_steps,
        sleep_hours=round(random.uniform(5.5, 9.0), 1),
        sleep_quality=random.choice(["Poor", "Fair", "Good", "Deep"]),
        activity_level=random.choice(["Low", "Moderate", "Active"]),
        calories=random.randint(40, 180),
        recorded_at=now,
    )
    db.session.add(reading)
    db.session.flush()

    _eval_wearable_vitals(user_id, reading)
    db.session.commit()
    return reading, True


@app.route("/api/wearable/device/<int:user_id>", methods=["GET"])
def get_wearable_device(user_id):
    """Simulator state + most recent reading (today's summary)."""
    sim = get_or_create_wearable_simulator(user_id)
    latest = (
        WearableReading.query
        .filter_by(user_id=user_id)
        .order_by(WearableReading.recorded_at.desc())
        .first()
    )
    latest_reading = _serialize_wearable_reading(latest) if latest else None
    return jsonify({
        "device": {
            "name": "HealTrack Band",
            "running": sim.running,
            "interval_seconds": sim.interval_seconds,
            "steps": sim.last_steps,
            "step_date": sim.step_date.isoformat() if sim.step_date else None,
        },
        "today": latest_reading,
    }), 200


@app.route("/api/wearable/simulator", methods=["POST"])
def update_wearable_simulator():
    """Start/stop the simulator and adjust polling interval."""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400

    sim = get_or_create_wearable_simulator(user_id)
    if "running" in data:
        sim.running = bool(data["running"])
    if "interval_seconds" in data:
        interval = int(data["interval_seconds"])
        sim.interval_seconds = max(1, min(30, interval))
    db.session.commit()

    return jsonify({
        "message": "Simulator updated",
        "device": {
            "name": "HealTrack Band",
            "running": sim.running,
            "interval_seconds": sim.interval_seconds,
        },
    }), 200


@app.route("/api/wearable/reading", methods=["POST"])
def force_wearable_reading():
    """Generate one simulated reading immediately (demo button)."""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400
    reading, _ = generate_wearable_reading(user_id, force=True)
    return jsonify({
        "message": "Reading simulated",
        "reading": _serialize_wearable_reading(reading),
    }), 201


@app.route("/api/wearable/readings/<int:user_id>", methods=["GET"])
def get_wearable_readings(user_id):
    """Poll endpoint — lazily generates a reading when due, then returns
    the time series (last `minutes` minutes, ascending)."""
    minutes = request.args.get("minutes", 60, type=int)
    minutes = max(1, min(1440, minutes))

    reading, _ = generate_wearable_reading(user_id)

    since = datetime.utcnow() - timedelta(minutes=minutes)
    rows = (
        WearableReading.query
        .filter(
            WearableReading.user_id == user_id,
            WearableReading.recorded_at >= since,
        )
        .order_by(WearableReading.recorded_at.asc())
        .all()
    )

    today = date.today()
    today_rows = (
        WearableReading.query
        .filter(
            WearableReading.user_id == user_id,
            WearableReading.recorded_at >= datetime.combine(today, datetime.min.time()),
        )
        .order_by(WearableReading.recorded_at.asc())
        .all()
    )

    return jsonify({
        "current": _serialize_wearable_reading(reading) if reading else None,
        "readings": [_serialize_wearable_reading(r) for r in rows],
        "today_count": len(today_rows),
    }), 200


@app.route("/api/wearable/alerts/<int:user_id>", methods=["GET"])
def get_wearable_alerts(user_id):
    """Abnormal-vitals alerts produced by the simulator (source='wearable')."""
    limit = request.args.get("limit", 20, type=int)
    alerts = (
        Alert.query
        .filter(
            Alert.user_id == user_id,
            Alert.source == "wearable",
        )
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    return jsonify({
        "alerts": [
            {
                "id": a.id,
                "type": a.type,
                "title": a.title,
                "message": a.message,
                "read": a.is_read if a.is_read is not None else False,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ]
    }), 200


# =====================================================
# START SERVER
# =====================================================

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        migrate_schema()
        ensure_seed_data()

    app.run(debug=True, port=5000)