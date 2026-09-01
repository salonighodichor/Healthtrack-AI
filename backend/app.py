import os
from datetime import datetime, date, timedelta

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

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
)

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///healtrack.db"
db.init_app(app)

CORS(app, origins="*")

# =====================================================
# UPLOAD FOLDERS
# =====================================================

UPLOAD_FOLDER = "uploads/recovery_photos"
HEALTH_RECORDS_UPLOAD_FOLDER = "uploads/health_records"

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

def create_alert_if_not_exists(user_id, alert_type, title, message):
    """Same din me duplicate alert dobara nahi banega."""
    today_start = datetime.combine(date.today(), datetime.min.time())

    existing = Alert.query.filter(
        Alert.user_id == user_id,
        Alert.title == title,
        Alert.created_at >= today_start
    ).first()

    if existing:
        return

    alert = Alert(
        user_id=user_id,
        type=alert_type,
        title=title,
        message=message
    )
    db.session.add(alert)
    db.session.commit()


def create_alert(user_id, alert_type, title, message):
    """Backwards-compatible alias (kept because other routes call this name)."""
    create_alert_if_not_exists(user_id, alert_type, title, message)


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
    return jsonify([
        {
            "id": t.id,
            "date": t.date.isoformat(),
            "name": t.name,
            "tag": t.tag,
            "status": t.status,
            "meta": t.meta
        }
        for t in tasks
    ])


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
    today = datetime.now().date()
    meds = Medicine.query.filter_by(user_id=user_id, date=today).all()

    return jsonify([
        {"id": m.id, "name": m.name, "instruction": m.instruction, "status": m.status}
        for m in meds
    ])


@app.route("/api/medicines", methods=["POST"])
def add_medicine():
    data = request.get_json()
    medicine = Medicine(
        user_id=data["user_id"],
        name=data["name"],
        instruction=data.get("instruction"),
        status=data.get("status", "pending"),
        date=datetime.strptime(data["date"], "%Y-%m-%d").date()
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

    db.session.commit()
    return jsonify({
        "message": "Medicine updated",
        "id": medicine.id,
        "name": medicine.name,
        "instruction": medicine.instruction,
        "status": medicine.status,
        "date": medicine.date.strftime("%Y-%m-%d") if medicine.date else None
    })


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

    return jsonify([
        {
            "id": a.id,
            "title": a.title,
            "subtitle": a.subtitle,
            "date": a.date.strftime("%d %b %Y") if a.date else None,
            "time": a.time,
            "status": a.status,
            "doctor_name": a.doctor_name,
            "location": a.location,
            "appointment_type": a.appointment_type,
            "notes": a.notes
        }
        for a in appts
    ])


@app.route("/api/appointments", methods=["POST"])
def add_appointment():
    data = request.get_json()
    appt = Appointment(
        user_id=data["user_id"],
        title=data["title"],
        subtitle=data.get("subtitle"),
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        time=data.get("time"),
        status=data.get("status", "Scheduled"),
        doctor_name=data.get("doctor_name"),
        location=data.get("location"),
        appointment_type=data.get("appointment_type"),
        notes=data.get("notes")
    )
    db.session.add(appt)
    db.session.commit()

    create_alert_if_not_exists(
        appt.user_id, "success", "Appointment Scheduled",
        f"{appt.title} scheduled on {appt.date.strftime('%d %b %Y')}"
        f"{' at ' + appt.time if appt.time else ''}."
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

    db.session.commit()

    return jsonify({
        "message": "Appointment updated",
        "id": appt.id,
        "date": appt.date.strftime("%d %b %Y") if appt.date else None,
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
        {"id": a.id, "type": a.type, "title": a.title, "message": a.message}
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


# =====================================================
# START SERVER
# =====================================================

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        ensure_seed_data()

    app.run(debug=True, port=5000)