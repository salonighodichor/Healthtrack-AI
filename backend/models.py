from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # Basic Information
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15))
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)

    # Patient - Basic Details
    dob = db.Column(db.String(20))
    age = db.Column(db.String(5))
    gender = db.Column(db.String(20))
    recovery_type = db.Column(db.String(50))
    emergency_contact = db.Column(db.String(15))

    # Patient - Physical Details
    height = db.Column(db.Float)
    weight = db.Column(db.Float)
    blood_group = db.Column(db.String(10))
    address = db.Column(db.Text)
    language = db.Column(db.String(20), default="English")
    notify_medicine = db.Column(db.Boolean, default=True)
    notify_appointment = db.Column(db.Boolean, default=True)
    notify_email = db.Column(db.Boolean, default=True)

    # Patient - Medical Details
    medical_conditions = db.Column(db.Text)
    allergies = db.Column(db.Text)
    current_medications = db.Column(db.Text)
    previous_surgery = db.Column(db.Text)
    medical_history = db.Column(db.Text)

    # Doctor-specific fields
    medical_registration_no = db.Column(db.String(50))
    specialization = db.Column(db.String(50))
    hospital_clinic = db.Column(db.String(100))
    experience = db.Column(db.String(20))

    # Caretaker-specific fields
    relationship = db.Column(db.String(30))
    patient_id = db.Column(db.Integer)


# ---------------- Vitals history (used by app.py's health-record routes) ----------------

class HealthRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    blood_sugar = db.Column(db.Float)
    heart_rate = db.Column(db.Float)
    systolic = db.Column(db.Integer)
    diastolic = db.Column(db.Integer)
    hemoglobin = db.Column(db.Float)

    recorded_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Documents / Reports (separate from vitals) ----------------

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    title = db.Column(db.String(200), nullable=False)
    record_type = db.Column(db.String(50))       # e.g. "Report", "Scan", "Prescription"
    file_path = db.Column(db.String(300))
    file_size = db.Column(db.String(20))          # e.g. "2 MB"
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        unique=True,
        nullable=False
    )

    # Security
    two_factor_auth = db.Column(db.Boolean, default=False)

    # Notifications
    notify_health_alert = db.Column(db.Boolean, default=True)

    # Health Preferences
    health_goals = db.Column(db.String(200), default="")
    reminder_frequency = db.Column(db.String(50), default="Daily")
    units = db.Column(db.String(20), default="Metric")

    # AI Preferences
    ai_recommendations = db.Column(db.Boolean, default=True)
    personalized_suggestions = db.Column(db.Boolean, default=True)
    ai_insights = db.Column(db.Boolean, default=True)

    # Connected Devices
    smartwatch_connected = db.Column(db.Boolean, default=False)
    fitness_tracker_connected = db.Column(db.Boolean, default=False)


# ---------------- Recovery Module ----------------

class RecoveryTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    tag = db.Column(db.String(50))          # Exercise / Medicine / Check-in
    status = db.Column(db.String(20), default="pending")   # pending / done / missed
    meta = db.Column(db.String(200))         # "Due 1:00 PM" or "Completed at..."


class DailyActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    date = db.Column(db.Date, nullable=False)

    name = db.Column(
        db.String(150),
        nullable=False
    )

    duration = db.Column(
        db.Integer,
        default=0
    )

    status = db.Column(
        db.String(20),
        default="pending"
    )

    meta = db.Column(
        db.String(200)
    )


class RecoveryPhoto(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    image_path = db.Column(db.String(300), nullable=False)
    note = db.Column(db.String(300))
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    name = db.Column(db.String(150), nullable=False)
    instruction = db.Column(db.String(200))
    status = db.Column(db.String(20), default="pending")   # taken / pending
    date = db.Column(db.Date, nullable=False)


class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    title = db.Column(db.String(200), nullable=False)
    subtitle = db.Column(db.String(200))
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(50))
    status = db.Column(db.String(50), default="Scheduled")


class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    type = db.Column(db.String(50))          # warning / info / success
    title = db.Column(db.String(200))
    message = db.Column(db.String(300))
    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

    # ...existing code...

class DoctorPatient(db.Model):
    """Many-to-Many relationship between doctors and patients"""
    id = db.Column(db.Integer, primary_key=True)
    
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    connected_at = db.Column(db.DateTime, server_default=db.func.now())