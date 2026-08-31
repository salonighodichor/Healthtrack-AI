from app import app
from models import db, User, RecoveryTask, DailyActivity, Medicine, Document, Appointment, Alert, HealthRecord
from datetime import date, timedelta

with app.app_context():
    db.create_all()

    # --- Create patient user ---
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
        DailyActivity(user_id=USER_ID, date=today, name="Meditation",
                       duration=20, status="done", meta="Completed"),
    ])
    
    # --- Add activities for last 6 days for weekly progress ---
    for i in range(1, 7):
        past_date = today - timedelta(days=i)
        num_activities = 3 + i % 2
        for j in range(num_activities):
            status = "done" if j < (num_activities - 1) else "pending"
            db.session.add(DailyActivity(
                user_id=USER_ID, 
                date=past_date, 
                name=f"Activity {j+1}",
                duration=15, 
                status=status, 
                meta="Daily activity"
            ))

    # --- Medicines ---
    db.session.add_all([
        Medicine(user_id=USER_ID, name="Aspirin 75mg", instruction="1 tablet • After breakfast",
                 status="taken", date=today),
        Medicine(user_id=USER_ID, name="Atorvastatin 10mg", instruction="1 tablet • After dinner",
                 status="pending", date=today),
        Medicine(user_id=USER_ID, name="Metoprolol 25mg", instruction="1 tablet • Morning",
                 status="taken", date=today),
    ])

    # --- Documents ---
    db.session.add_all([
        Document(user_id=USER_ID, title="Medical Check Up Report", record_type="Report", file_size="2 MB"),
        Document(user_id=USER_ID, title="Blood Count Report", record_type="Report", file_size="5 MB"),
        Document(user_id=USER_ID, title="Heart ECG Report", record_type="Report", file_size="10 MB"),
        Document(user_id=USER_ID, title="MRI Brain Report", record_type="Report", file_size="25.8 MB"),
    ])

    # --- Appointments ---
    db.session.add_all([
        Appointment(user_id=USER_ID, title="Cardiology Follow-up", subtitle="Doctor appointment",
                    date=date(2026, 9, 20), time="10:30 AM", status="Upcoming"),
        Appointment(user_id=USER_ID, title="Blood Test", subtitle="Diagnostic Center",
                    date=date(2026, 9, 25), time="09:00 AM", status="Scheduled"),
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
    
    # --- Create Doctor users ---
    doctor1 = User(
        name="Dr. Rajesh Sharma",
        email="rajesh@hospital.com",
        phone="9123456789",
        password="123456",
        role="doctor",
        medical_registration_no="MCI/2018/12345",
        specialization="Cardiology",
        hospital_clinic="City Heart Hospital",
        experience="12 years"
    )
    
    doctor2 = User(
        name="Dr. Priya Patel",
        email="priya@hospital.com",
        phone="9234567890",
        password="123456",
        role="doctor",
        medical_registration_no="MCI/2019/67890",
        specialization="General Medicine",
        hospital_clinic="Metro Medical Center",
        experience="8 years"
    )
    
    doctor3 = User(
        name="Dr. Amit Singh",
        email="amit@hospital.com",
        phone="9345678901",
        password="123456",
        role="doctor",
        medical_registration_no="MCI/2017/54321",
        specialization="Neurology",
        hospital_clinic="Brain Care Institute",
        experience="15 years"
    )
    
    db.session.add_all([doctor1, doctor2, doctor3])
    db.session.commit()

    print("[+] Test data added successfully!")
    print(f"    Patient ID = {USER_ID} (rani@gmail.com)")
    print(f"    Doctor 1 ID = {doctor1.id} (rajesh@hospital.com)")
    print(f"    Doctor 2 ID = {doctor2.id} (priya@hospital.com)")
    print(f"    Doctor 3 ID = {doctor3.id} (amit@hospital.com)")
