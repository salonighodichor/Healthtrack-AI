from app import app
from models import db, User, RecoveryTask, DailyActivity, Medicine, Document, Appointment, Alert, HealthRecord
from datetime import date

with app.app_context():
    db.create_all()

    # --- Create patient user ---
    patient = User(
        name="sai",
        email="sai@gmail.com",
        phone="3453453443",
        password="123456",
        role="patient",
        dob="2000-11-11",
        age="25",
        gender="Female",
        recovery_type="Medication Recovery",
        emergency_contact="6556546546",
        height=125.0,
        weight=32.0,
        blood_group="AB+",
    )
    db.session.add(patient)
    db.session.commit()

    USER_ID = patient.id
    today = date.today()

    # --- Recovery Tasks (including Check-in) ---
    db.session.add_all([
        RecoveryTask(user_id=USER_ID, date=today, name="Morning stretch — 15 min",
                     tag="Exercise", status="done", meta="Completed at 8:10 AM"),
        RecoveryTask(user_id=USER_ID, date=today, name="Take Vitamin D — 1 tablet",
                     tag="Medicine", status="pending", meta="Due 1:00 PM"),
        RecoveryTask(user_id=USER_ID, date=today, name="Evening walk — 20 min",
                     tag="Exercise", status="pending", meta="Due 6:00 PM"),
        RecoveryTask(user_id=USER_ID, date=today, name="How are you feeling today?",
                     tag="Check-in", status="pending", meta="Quick check-in"),
    ])

    # --- Daily Activities (Dashboard "Daily Activity" card ke liye) ---
    db.session.add_all([
        DailyActivity(user_id=USER_ID, date=today, name="Morning Walk",
                       duration=15, status="done", meta="Completed"),
        DailyActivity(user_id=USER_ID, date=today, name="Breathing Exercise",
                       duration=10, status="done", meta="Completed"),
        DailyActivity(user_id=USER_ID, date=today, name="Stretching",
                       duration=10, status="pending", meta="Not done yet"),
    ])

    # --- Medicines ---
    db.session.add_all([
        Medicine(user_id=USER_ID, name="Aspirin 75mg", instruction="1 tablet • After breakfast",
                 status="taken", date=today),
        Medicine(user_id=USER_ID, name="Atorvastatin 10mg", instruction="1 tablet • After dinner",
                 status="pending", date=today),
    ])

    # --- Documents ---
    db.session.add_all([
        Document(user_id=USER_ID, title="Medical Check Up Report", record_type="Report", file_size="2 MB"),
        Document(user_id=USER_ID, title="Blood Count Report", record_type="Report", file_size="5 MB"),
    ])

    # --- Appointments ---
    db.session.add_all([
        Appointment(user_id=USER_ID, title="Cardiology Follow-up", subtitle="Doctor appointment",
                    date=date(2026, 9, 20), time="10:30 AM", status="Upcoming"),
    ])

    # --- Alerts ---
    db.session.add_all([
        Alert(user_id=USER_ID, type="warning", title="Medicine Reminder",
              message="Your medicine schedule needs attention."),
    ])

    # --- Health Record (vitals) ---
    db.session.add(HealthRecord(
        user_id=USER_ID, blood_sugar=80, heart_rate=98,
        systolic=90, diastolic=72, hemoglobin=14
    ))

    db.session.commit()
    print(f"[+] Test data added successfully! Patient ID = {USER_ID}")