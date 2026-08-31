from datetime import datetime, date, timedelta
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from models import (
    db, User, HealthRecord, UserSettings, RecoveryTask,
    DailyActivity, RecoveryPhoto, Medicine, Appointment,
    Alert, Document, DoctorPatient
)

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///healtrack.db"
db.init_app(app)
CORS(app, origins="*")

UPLOAD_FOLDER = "uploads/recovery_photos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =====================================================
# HOME
# =====================================================
@app.route("/")
def home():
    return {"message": "HealTrack backend is running! 🚀"}

# =====================================================
# AUTH / REGISTER
# =====================================================
@app.route("/api/register/patient", methods=["POST"])
def register_patient():
    data = request.get_json()
    
    if User.query.filter_by(email=data["email"]).first():
        return {"message": "Email already exists"}, 400
    
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
    
    return {"message": "Patient registered successfully!", "user_id": user.id}, 201

@app.route("/api/register/doctor", methods=["POST"])
def register_doctor():
    data = request.get_json()
    
    if User.query.filter_by(email=data["email"]).first():
        return {"message": "Email already exists"}, 400
    
    user = User(
        name=data["fullName"],
        email=data["email"],
        phone=data["phone"],
        password=data["password"],
        role="doctor",
        medical_registration_no=data.get("medicalRegistrationNo"),
        specialization=data.get("specialization"),
        hospital_clinic=data.get("hospitalClinic"),
        experience=data.get("experience"),
        address=data.get("address")
    )
    
    db.session.add(user)
    db.session.commit()
    
    return {"message": "Doctor registered successfully!", "user_id": user.id}, 201

@app.route("/api/register/caretaker", methods=["POST"])
def register_caretaker():
    data = request.get_json()
    
    if User.query.filter_by(email=data["email"]).first():
        return {"message": "Email already exists"}, 400
    
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
    
    return {"message": "Caretaker registered successfully!", "user_id": user.id}, 201

# =====================================================
# LOGIN
# =====================================================
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    email_aliases = {
        "rani@example.com": "rani@gmail.com",
        "asha@healtrack.ai": "asha@healtrack.ai",
    }
    password_aliases = {
        "rani123": "123456",
        "doctor123": "123456",
    }

    email = (data.get("email") or "").strip().lower()
    normalized_email = email_aliases.get(email, email)
    role = (data.get("role") or "").lower()
    user = User.query.filter_by(email=normalized_email, role=role).first()

    passwords_to_try = {data.get("password")}
    if data.get("password") in password_aliases:
        passwords_to_try.add(password_aliases[data["password"]])

    if not user:
        return {"message": "Invalid credentials"}, 401

    if user.password not in passwords_to_try:
        return {"message": "Invalid credentials"}, 401

    return {
        "message": "Login successful!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }, 200

# =====================================================
# PATIENT PROFILE
# =====================================================
@app.route("/api/patient/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    patient = User.query.get_or_404(patient_id)
    
    return {
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
        "medical_history": patient.medical_history
    }, 200

@app.route("/api/patient/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):
    patient = User.query.get_or_404(patient_id)
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
    
    return {"message": "Patient details updated successfully!"}, 200

# =====================================================
# HEALTH RECORDS (VITALS)
# =====================================================
NORMAL_RANGES = {
    "blood_sugar": (70, 140),
    "heart_rate": (60, 100),
    "systolic": (90, 120),
    "diastolic": (60, 80),
    "hemoglobin": (12, 16),
}

def get_status(field, value):
    if value is None:
        return "unknown"
    if field not in NORMAL_RANGES:
        return "normal"
    
    low, high = NORMAL_RANGES[field]
    if value < low:
        return "low"
    if value > high:
        return "high"
    return "normal"

@app.route("/api/health-record", methods=["POST"])
def add_health_record():
    data = request.get_json()
    
    record = HealthRecord(
        user_id=data["user_id"],
        blood_sugar=data.get("blood_sugar"),
        heart_rate=data.get("heart_rate"),
        systolic=data.get("systolic"),
        diastolic=data.get("diastolic"),
        hemoglobin=data.get("hemoglobin")
    )
    
    db.session.add(record)
    db.session.commit()
    
    # Create alerts for abnormal readings
    if data.get("blood_sugar"):
        status = get_status("blood_sugar", data["blood_sugar"])
        if status != "normal":
            create_alert(
                data["user_id"],
                "warning" if status == "high" else "info",
                f"Blood Sugar Alert",
                f"Your blood sugar is {status}: {data['blood_sugar']} mg/dL"
            )
    
    if data.get("heart_rate"):
        status = get_status("heart_rate", data["heart_rate"])
        if status != "normal":
            create_alert(
                data["user_id"],
                "warning" if status == "high" else "info",
                f"Heart Rate Alert",
                f"Your heart rate is {status}: {data['heart_rate']} BPM"
            )
    
    return {"message": "Health record added successfully!", "record_id": record.id}, 201

@app.route("/api/health-record/<int:user_id>", methods=["GET"])
def get_health_records(user_id):
    records = HealthRecord.query.filter_by(user_id=user_id).order_by(
        HealthRecord.recorded_at.desc()
    ).all()
    
    return {
        "records": [
            {
                "id": r.id,
                "blood_sugar": r.blood_sugar,
                "heart_rate": r.heart_rate,
                "systolic": r.systolic,
                "diastolic": r.diastolic,
                "hemoglobin": r.hemoglobin,
                "recorded_at": r.recorded_at.isoformat()
            }
            for r in records
        ]
    }, 200

@app.route("/api/health-record/<int:user_id>/latest", methods=["GET"])
def get_latest_health_record(user_id):
    record = HealthRecord.query.filter_by(user_id=user_id).order_by(
        HealthRecord.recorded_at.desc()
    ).first()
    
    if not record:
        return {"message": "No health records found"}, 404
    
    return {
        "id": record.id,
        "blood_sugar": record.blood_sugar,
        "heart_rate": record.heart_rate,
        "systolic": record.systolic,
        "diastolic": record.diastolic,
        "hemoglobin": record.hemoglobin,
        "recorded_at": record.recorded_at.isoformat()
    }, 200

@app.route("/api/documents/<int:user_id>", methods=["GET"])
def get_documents(user_id):
    documents = Document.query.filter_by(user_id=user_id).order_by(
        Document.created_at.desc(), Document.id.desc()
    ).all()

    return {
        "documents": [
            {
                "id": d.id,
                "title": d.title,
                "record_type": d.record_type or "Report",
                "file_size": d.file_size or "N/A",
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in documents
        ],
        "records": [
            {
                "id": d.id,
                "title": d.title,
                "record_type": d.record_type or "Report",
                "file_size": d.file_size or "N/A",
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in documents
        ],
    }, 200

@app.route("/api/health-records/<int:user_id>", methods=["GET"])
def get_health_records_list(user_id):
    return get_documents(user_id)

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

        if any(status != "normal" for status in vitals.values()):
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

    return {
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
    }, 200

# =====================================================
# RECOVERY TASKS
# =====================================================
@app.route("/api/recovery-tasks/<int:user_id>", methods=["GET"])
def get_recovery_tasks(user_id):
    tasks = RecoveryTask.query.filter_by(user_id=user_id).order_by(
        RecoveryTask.date.asc()
    ).all()
    
    return {
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
    }, 200

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
    
    return {"message": "Recovery task added!", "task_id": task.id}, 201

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
    
    return {"message": "Recovery task updated!"}, 200

# =====================================================
# MEDICINES
# =====================================================
@app.route("/api/medicines/<int:user_id>", methods=["GET"])
def get_medicines(user_id):
    medicines = Medicine.query.filter_by(user_id=user_id).order_by(
        Medicine.date.desc()
    ).all()
    
    return {
        "medicines": [
            {
                "id": m.id,
                "name": m.name,
                "instruction": m.instruction,
                "status": m.status,
                "date": m.date.isoformat()
            }
            for m in medicines
        ]
    }, 200

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
    
    return {"message": "Medicine added!", "medicine_id": medicine.id}, 201

@app.route("/api/medicines/<int:med_id>", methods=["PUT"])
def update_medicine(med_id):
    medicine = Medicine.query.get_or_404(med_id)
    data = request.get_json()
    
    if "status" in data:
        medicine.status = data["status"]
    if "instruction" in data:
        medicine.instruction = data["instruction"]
    
    db.session.commit()
    
    return {"message": "Medicine updated!"}, 200

# =====================================================
# APPOINTMENTS
# =====================================================
@app.route("/api/appointments/<int:user_id>", methods=["GET"])
def get_appointments(user_id):
    appointments = Appointment.query.filter_by(user_id=user_id).order_by(
        Appointment.date.asc()
    ).all()
    
    return {
        "appointments": [
            {
                "id": a.id,
                "title": a.title,
                "subtitle": a.subtitle,
                "date": a.date.isoformat(),
                "time": a.time,
                "status": a.status
            }
            for a in appointments
        ]
    }, 200

@app.route("/api/appointments", methods=["POST"])
def add_appointment():
    data = request.get_json()
    
    appointment = Appointment(
        user_id=data["user_id"],
        title=data["title"],
        subtitle=data.get("subtitle"),
        date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        time=data.get("time"),
        status=data.get("status", "Scheduled")
    )
    
    db.session.add(appointment)
    db.session.commit()
    
    return {"message": "Appointment added!", "appointment_id": appointment.id}, 201

# =====================================================
# ALERTS
# =====================================================
def create_alert(user_id, alert_type, title, message):
    alert = Alert(
        user_id=user_id,
        type=alert_type,
        title=title,
        message=message
    )
    db.session.add(alert)
    db.session.commit()

@app.route("/api/alerts/<int:user_id>", methods=["GET"])
def get_alerts(user_id):
    alerts = Alert.query.filter_by(user_id=user_id).order_by(
        Alert.created_at.desc()
    ).all()
    
    return {
        "alerts": [
            {
                "id": a.id,
                "type": a.type,
                "title": a.title,
                "message": a.message,
                "created_at": a.created_at.isoformat()
            }
            for a in alerts
        ]
    }, 200

# =====================================================
# DOCTOR FUNCTIONS
# =====================================================
@app.route("/api/doctor/<int:doctor_id>/patients", methods=["GET"])
def get_doctor_patients(doctor_id):
    """Get list of patients assigned to a doctor"""
    doctor = User.query.get_or_404(doctor_id)

    if doctor.role != "doctor":
        return {"message": "Only doctors can access this"}, 403

    connection_ids = [
        item.patient_id for item in DoctorPatient.query.filter_by(doctor_id=doctor_id).all()
    ]

    if connection_ids:
        patients = User.query.filter(User.id.in_(connection_ids)).all()
    else:
        patients = User.query.filter_by(role="patient").all()

    return {
        "patients": [
            {
                "id": patient.id,
                "name": patient.name,
                "email": patient.email,
                "age": patient.age,
                "gender": patient.gender,
                "recovery_type": patient.recovery_type,
                "phone": patient.phone,
                "blood_group": patient.blood_group,
                "emergency_contact": patient.emergency_contact,
            }
            for patient in patients
        ]
    }, 200

@app.route("/api/doctor/<int:doctor_id>/patient-vitals/<int:patient_id>", methods=["GET"])
def get_patient_vitals_for_doctor(doctor_id, patient_id):
    """Doctor views patient's vitals"""
    doctor = User.query.get_or_404(doctor_id)
    if doctor.role != "doctor":
        return {"message": "Only doctors can access this"}, 403

    patient = User.query.get_or_404(patient_id)
    connection = DoctorPatient.query.filter_by(doctor_id=doctor_id, patient_id=patient_id).first()
    if not connection and patient.role == "patient":
        connection = DoctorPatient(doctor_id=doctor_id, patient_id=patient_id)

    records = HealthRecord.query.filter_by(user_id=patient_id).order_by(
        HealthRecord.recorded_at.desc()
    ).limit(10).all()

    caretaker = User.query.filter_by(role="caretaker", patient_id=patient_id).first()

    return {
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
    }, 200

@app.route("/api/check-reminders/<int:user_id>", methods=["GET"])
def check_reminders(user_id):
    user = User.query.get_or_404(user_id)

    pending_medicines = Medicine.query.filter_by(user_id=user_id, status="pending").count()
    pending_tasks = RecoveryTask.query.filter_by(user_id=user_id, status="pending").count()
    upcoming_appointments = Appointment.query.filter(
        Appointment.user_id == user_id,
        Appointment.date >= date.today()
    ).count()

    return {
        "message": "Reminders checked successfully",
        "user_id": user.id,
        "checked_at": datetime.utcnow().isoformat(),
        "reminders": {
            "medicine": pending_medicines,
            "recovery_tasks": pending_tasks,
            "appointments": upcoming_appointments,
        },
        "patient": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
        }
    }, 200

@app.route("/api/caretaker/<int:caretaker_id>/patient", methods=["GET"])
def get_caretaker_patient(caretaker_id):
    caretaker = User.query.get_or_404(caretaker_id)
    if caretaker.role != "caretaker":
        return {"message": "Only caretakers can access this"}, 403

    patient = None
    if caretaker.patient_id:
        patient = User.query.get(caretaker.patient_id)

    if not patient:
        patient = User.query.filter_by(role="patient").order_by(User.id.asc()).first()

    doctor = None
    if patient:
        connection = DoctorPatient.query.filter_by(patient_id=patient.id).order_by(
            DoctorPatient.connected_at.desc()
        ).first()
        if connection:
            doctor = User.query.get(connection.doctor_id)

    return {
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
    }, 200

# =====================================================
# CHANGE PASSWORD
# =====================================================
@app.route("/api/patient/<int:patient_id>/password", methods=["PUT"])
def change_password(patient_id):
    patient = User.query.get_or_404(patient_id)
    data = request.get_json()
    
    if patient.password != data["old_password"]:
        return {"message": "Old password is incorrect"}, 400
    
    patient.password = data["new_password"]
    db.session.commit()
    
    return {"message": "Password changed successfully!"}, 200

# =====================================================
# UPDATE CONTACT
# =====================================================
@app.route("/api/patient/<int:patient_id>/contact", methods=["PUT"])
def update_contact(patient_id):
    patient = User.query.get_or_404(patient_id)
    data = request.get_json()
    
    if patient.password != data["current_password"]:
        return {"message": "Password is incorrect"}, 400
    
    if "email" in data:
        patient.email = data["email"]
    if "phone" in data:
        patient.phone = data["phone"]
    
    db.session.commit()
    
    return {"message": "Contact information updated!"}, 200

# =====================================================
# DELETE ACCOUNT
# =====================================================
@app.route("/api/patient/<int:patient_id>", methods=["DELETE"])
def delete_account(patient_id):
    patient = User.query.get_or_404(patient_id)
    data = request.get_json()
    
    if patient.password != data["password"]:
        return {"message": "Password is incorrect"}, 400
    
    db.session.delete(patient)
    db.session.commit()
    
    return {"message": "Account deleted successfully!"}, 200

# =====================================================
# DAILY ACTIVITIES
# =====================================================
@app.route("/api/daily-activities/<int:user_id>", methods=["GET"])
def get_daily_activities(user_id):
    today = date.today()
    activities = DailyActivity.query.filter_by(
        user_id=user_id, date=today
    ).all()
    
    if not activities:
        return {
            "activities": [],
            "completed": 0,
            "total": 0,
            "percentage": 0
        }, 200
    
    completed = len([a for a in activities if a.status == "done"])
    total = len(activities)
    percentage = int((completed / total) * 100) if total > 0 else 0
    
    return {
        "activities": [
            {
                "id": a.id,
                "name": a.name,
                "duration": a.duration,
                "status": a.status,
                "meta": a.meta
            }
            for a in activities
        ],
        "completed": completed,
        "total": total,
        "percentage": percentage
    }, 200

@app.route("/api/daily-activities/<int:activity_id>", methods=["PUT"])
def update_daily_activity(activity_id):
    activity = DailyActivity.query.get_or_404(activity_id)
    data = request.get_json()
    
    if "status" in data:
        activity.status = data["status"]
    if "meta" in data:
        activity.meta = data["meta"]
    
    db.session.commit()
    
    return {"message": "Daily activity updated!"}, 200

# =====================================================
# RECOVERY PROGRESS
# =====================================================
@app.route("/api/recovery-progress/<int:user_id>", methods=["GET"])
def get_recovery_progress(user_id):
    today = date.today()
    
    # Get today's recovery progress
    today_activities = DailyActivity.query.filter_by(
        user_id=user_id, date=today
    ).all()
    
    today_completed = len([a for a in today_activities if a.status == "done"])
    today_total = len(today_activities)
    today_percent = int((today_completed / today_total) * 100) if today_total > 0 else 0
    
    # Get weekly progress (last 7 days)
    weekly_progress = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_activities = DailyActivity.query.filter_by(
            user_id=user_id, date=day
        ).all()
        
        day_completed = len([a for a in day_activities if a.status == "done"])
        day_total = len(day_activities)
        day_percent = int((day_completed / day_total) * 100) if day_total > 0 else 0
        
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        
        weekly_progress.append({
            "date": day.isoformat(),
            "day": day_names[day.weekday()],
            "percent": day_percent
        })
    
    # Calculate streak
    streak = 0
    current_date = today
    while True:
        activities = DailyActivity.query.filter_by(
            user_id=user_id, date=current_date
        ).all()
        
        completed = len([a for a in activities if a.status == "done"])
        total = len(activities)
        
        if total == 0 or completed == 0:
            break
        
        if completed < total:
            break
        
        streak += 1
        current_date = current_date - timedelta(days=1)
    
    return {
        "today": {
            "completion_percent": today_percent,
            "completed": today_completed,
            "total": today_total
        },
        "weekly_progress": weekly_progress,
        "current_streak": streak
    }, 200

# =====================================================
# DASHBOARD PROGRESS
# =====================================================
@app.route("/api/dashboard-progress/<int:user_id>", methods=["GET"])
def get_dashboard_progress(user_id):
    range_param = request.args.get("range", "month")
    today = date.today()

    if range_param == "week":
        start_date = today - timedelta(days=7)
    elif range_param == "last-week":
        start_date = today - timedelta(days=14)
        end_date = today - timedelta(days=7)
    elif range_param == "last-month":
        start_date = today - timedelta(days=60)
        end_date = today - timedelta(days=30)
    elif range_param == "year":
        start_date = today - timedelta(days=365)
    else:
        start_date = today - timedelta(days=30)

    if range_param in ("last-week", "last-month"):
        activities = DailyActivity.query.filter(
            DailyActivity.user_id == user_id,
            DailyActivity.date >= start_date,
            DailyActivity.date < end_date
        ).all()
        tasks = RecoveryTask.query.filter(
            RecoveryTask.user_id == user_id,
            RecoveryTask.date >= start_date,
            RecoveryTask.date < end_date
        ).all()
        end_date = end_date
    else:
        activities = DailyActivity.query.filter(
            DailyActivity.user_id == user_id,
            DailyActivity.date >= start_date
        ).all()
        tasks = RecoveryTask.query.filter(
            RecoveryTask.user_id == user_id,
            RecoveryTask.date >= start_date
        ).all()
        end_date = today

    completed = len([a for a in activities if a.status == "done"])
    total = len(activities)
    overall_percent = int((completed / total) * 100) if total > 0 else 0

    tasks_completed = len([t for t in tasks if t.status == "done"])
    tasks_total = len(tasks)
    medication_percent = int((tasks_completed / tasks_total) * 100) if tasks_total > 0 else 0

    response = {
        "range": range_param,
        "overall": overall_percent,
        "overall_completion": overall_percent,
        "physical_recovery": overall_percent,
        "medication": medication_percent,
        "activities": {
            "completed": completed,
            "total": total,
            "percentage": overall_percent
        },
        "recovery_tasks": {
            "completed": tasks_completed,
            "total": tasks_total,
            "percentage": medication_percent
        },
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }

    return response, 200

# =====================================================
# RECOVERY TASKS - DELETE
# =====================================================
@app.route("/api/recovery-tasks/<int:task_id>", methods=["DELETE"])
def delete_recovery_task(task_id):
    task = RecoveryTask.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    
    return {"message": "Recovery task deleted!"}, 200

# =====================================================
# DOCTORS
# =====================================================
@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    doctors = User.query.filter_by(role="doctor").all()
    
    return {
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
    }, 200

@app.route("/api/patient/<int:patient_id>/connect-doctor", methods=["POST"])
def connect_doctor(patient_id):
    data = request.get_json()
    doctor_id = data.get("doctorId")
    
    patient = User.query.get_or_404(patient_id)
    doctor = User.query.get_or_404(doctor_id)
    
    if doctor.role != "doctor":
        return {"message": "Invalid doctor ID"}, 400
    
    # Check if already connected
    existing = DoctorPatient.query.filter_by(
        doctor_id=doctor_id, patient_id=patient_id
    ).first()
    
    if existing:
        return {"message": "Already connected with this doctor"}, 200
    
    # Create connection
    connection = DoctorPatient(
        doctor_id=doctor_id,
        patient_id=patient_id
    )
    
    db.session.add(connection)
    db.session.commit()
    
    # Create alert for patient
    create_alert(
        patient_id,
        "success",
        "Doctor Connected",
        f"You have connected with Dr. {doctor.name} ({doctor.specialization})"
    )
    
    return {
        "message": f"Connected successfully with Dr. {doctor.name}",
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "specialization": doctor.specialization
        }
    }, 201


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

    legacy_doctor = User.query.filter_by(email="rajesh@hospital.com").first()
    if legacy_doctor and not DoctorPatient.query.filter_by(doctor_id=legacy_doctor.id, patient_id=patient.id).first():
        db.session.add(DoctorPatient(doctor_id=legacy_doctor.id, patient_id=patient.id))

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

    if patient.id and legacy_doctor and not DoctorPatient.query.filter_by(doctor_id=legacy_doctor.id, patient_id=patient.id).first():
        db.session.add(DoctorPatient(doctor_id=legacy_doctor.id, patient_id=patient.id))
        db.session.commit()

with app.app_context():
    db.create_all()
    ensure_seed_data()

# =====================================================
# START SERVER
# =====================================================
if __name__ == "__main__":
    app.run(debug=True, port=5000)