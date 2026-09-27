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

    # Notifications
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
    qualification = db.Column(db.String(100))
    hospital_clinic = db.Column(db.String(100))
    experience = db.Column(db.String(20))

    # Caretaker-specific fields
    relationship = db.Column(db.String(30))
    patient_id = db.Column(db.Integer)


# ---------------- Vitals history ----------------
class HealthRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
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


# ---------------- Documents / Reports ----------------
class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    title = db.Column(db.String(200), nullable=False)
    record_type = db.Column(db.String(50))
    file_path = db.Column(db.String(300))
    file_size = db.Column(db.String(20))

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
    reminder_frequency = db.Column(
        db.String(50),
        default="Daily"
    )
    units = db.Column(
        db.String(20),
        default="Metric"
    )

    # AI Preferences
    ai_recommendations = db.Column(
        db.Boolean,
        default=True
    )
    personalized_suggestions = db.Column(
        db.Boolean,
        default=True
    )
    ai_insights = db.Column(
        db.Boolean,
        default=True
    )

    # Connected Devices
    smartwatch_connected = db.Column(
        db.Boolean,
        default=False
    )
    fitness_tracker_connected = db.Column(
        db.Boolean,
        default=False
    )


# ---------------- Recovery Module ----------------
class RecoveryTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    tag = db.Column(db.String(50))
    status = db.Column(
        db.String(20),
        default="pending"
    )
    meta = db.Column(db.String(200))


class DailyActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
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
        db.ForeignKey("user.id"),
        nullable=False
    )

    image_path = db.Column(
        db.String(300),
        nullable=False
    )

    note = db.Column(
        db.String(300)
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Medicines ----------------
class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    dosage = db.Column(db.String(50), default="")

    frequency = db.Column(db.String(50), default="Once daily")

    timing = db.Column(db.String(50), default="morning")

    instruction = db.Column(
        db.String(200)
    )

    # taken / pending / missed
    status = db.Column(
        db.String(20),
        default="pending"
    )

    date = db.Column(
        db.Date,
        nullable=False
    )

    # Expiry date - ISO format YYYY-MM-DD (optional)
    expiry_date = db.Column(
        db.String(10)
    )


# ---------------- Appointments ----------------
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    subtitle = db.Column(
        db.String(200)
    )

    date = db.Column(
        db.Date,
        nullable=False
    )

    time = db.Column(
        db.String(50)
    )

    status = db.Column(
        db.String(50),
        default="Scheduled"
    )

    # Additional appointment fields
    doctor_name = db.Column(
        db.String(200)
    )

    doctor_id = db.Column(db.Integer)

    department = db.Column(
        db.String(50)
    )

    reason = db.Column(
        db.Text
    )

    location = db.Column(
        db.String(200)
    )

    appointment_type = db.Column(
        db.String(50)
    )

    notes = db.Column(
        db.Text
    )


# ---------------- Health Record File Uploads ----------------
class HealthRecordFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    # Example:
    # Medical Check Up Report
    # Blood Test
    # Scan
    # Prescription
    record_type = db.Column(
        db.String(200),
        nullable=False
    )

    filename = db.Column(
        db.String(300),
        nullable=False
    )

    file_path = db.Column(
        db.String(300),
        nullable=False
    )

    file_size = db.Column(
        db.String(20)
    )

    # pdf / jpg / jpeg / png
    file_type = db.Column(
        db.String(20)
    )

    uploaded_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Alerts ----------------
class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    # warning / info / success
    type = db.Column(
        db.String(50)
    )

    title = db.Column(
        db.String(200)
    )

    message = db.Column(
        db.String(300)
    )

    is_read = db.Column(
        db.Boolean,
        default=False
    )

    # alert source: system / wearable / etc.
    source = db.Column(
        db.String(30),
        default="system"
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Doctor / Patient Connection ----------------
class DoctorPatient(db.Model):
    """
    Many-to-Many relationship between
    doctors and patients.
    """

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    doctor_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    connected_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )

class Message(db.Model):
    """
    Patient <-> Doctor direct chat message.

    A row is one message in a two-party conversation. Threads are
    implicit: the (sender, receiver) pair defines the conversation key,
    and ordering within a thread is by created_at (oldest first).

    read_at IS NULL  -> unread
    read_at set      -> read by the receiver
    """

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    sender_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    receiver_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    read_at = db.Column(
        db.DateTime
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class PatientMedicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    medicine_name = db.Column(
        db.String(150),
        nullable=False
    )

    generic_name = db.Column(
        db.String(150)
    )

    mfg_date = db.Column(
        db.String(50)
    )

    expiry_date = db.Column(
        db.String(50)
    )

    image_path = db.Column(
        db.String(300)
    )

    status = db.Column(
        db.String(50),
        default="Safe"
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Daily Health Check-in ----------------
class DailyCheckin(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    checkin_date = db.Column(
        db.Date,
        nullable=False
    )

    pain_level = db.Column(
        db.Integer,
        default=0
    )

    sleep_hours = db.Column(
        db.Float
    )

    sleep_quality = db.Column(
        db.String(30)
    )

    activity_level = db.Column(
        db.String(30)
    )

    symptoms = db.Column(
        db.Text
    )

    temperature = db.Column(
        db.Float
    )

    systolic = db.Column(
        db.Integer
    )

    diastolic = db.Column(
        db.Integer
    )

    spo2 = db.Column(
        db.Integer
    )

    notes = db.Column(
        db.Text
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Recovery Plans ----------------
class RecoveryPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    doctor_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    start_date = db.Column(
        db.Date
    )

    end_date = db.Column(
        db.Date
    )

    status = db.Column(
        db.String(30),
        default="active"
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class RecoveryPlanActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    plan_id = db.Column(
        db.Integer,
        db.ForeignKey("recovery_plan.id"),
        nullable=False
    )

    name = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text
    )

    frequency = db.Column(
        db.String(50),
        default="Daily"
    )

    duration_min = db.Column(
        db.Integer,
        default=0
    )

    status = db.Column(
        db.String(30),
        default="pending"
    )

    due_date = db.Column(
        db.Date
    )


class RecoveryPlanGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    plan_id = db.Column(
        db.Integer,
        db.ForeignKey("recovery_plan.id"),
        nullable=False
    )

    name = db.Column(
        db.String(200),
        nullable=False
    )

    target_value = db.Column(
        db.Float,
        default=0
    )

    instruction = db.Column(
        db.Text
    )

    achieved = db.Column(
        db.Boolean,
        default=False
    )


# ---------------- Health Score Snapshots ----------------
class HealthScoreSnapshot(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    snapshot_date = db.Column(
        db.Date,
        nullable=False
    )

    score = db.Column(
        db.Integer,
        default=0
    )

    components = db.Column(
        db.Text
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Gamification ----------------
class GamificationState(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False,
        unique=True
    )

    points = db.Column(
        db.Integer,
        default=0
    )

    level = db.Column(
        db.Integer,
        default=1
    )

    streak = db.Column(
        db.Integer,
        default=0
    )

    last_streak_date = db.Column(
        db.Date
    )

    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    description = db.Column(
        db.String(300)
    )

    icon = db.Column(
        db.String(50),
        default="🏅"
    )

    earned_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Phase-2: Recovery Milestones ----------------
class RecoveryMilestone(db.Model):
    """
    Doctor-defined recovery checkpoints for a patient. Status flow:
    pending -> in_progress -> completed.
    """

    id = db.Column(db.Integer, primary_key=True)

    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    doctor_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id")
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(db.Text)

    category = db.Column(db.String(50))

    due_date = db.Column(db.Date)

    # pending / in_progress / completed
    status = db.Column(
        db.String(20),
        default="pending"
    )

    order_index = db.Column(
        db.Integer,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Phase-2: Health Journal ----------------
class HealthJournal(db.Model):
    """
    One daily journal entry per user. Mood + symptoms + free notes.
    """

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    entry_date = db.Column(
        db.Date,
        nullable=False
    )

    mood = db.Column(db.String(30))

    # 1 (very low) .. 5 (great)
    mood_score = db.Column(db.Integer)

    sleep_hours = db.Column(db.Float)

    # comma separated symptom names (also free text allowed)
    symptoms = db.Column(db.Text)

    notes = db.Column(db.Text)

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


# ---------------- Phase-2: Medication Interaction Rules ----------------
class MedicineInteractionRule(db.Model):
    """
    Static medicine-pair interaction rules used by the fully
    independent Medication Interaction Checker module.
    """

    id = db.Column(db.Integer, primary_key=True)

    medicine_a = db.Column(
        db.String(150),
        nullable=False
    )

    medicine_b = db.Column(
        db.String(150),
        nullable=False
    )

    # mild / moderate / severe
    severity = db.Column(
        db.String(20),
        default="moderate"
    )

    warning = db.Column(db.Text)

    recommendation = db.Column(db.Text)


# ---------------- Phase-5: Wearable / Smart Monitoring ----------------
class WearableSimulator(db.Model):
    """
    Per-user simulated wearable state. The simulator lazily generates
    readings on each poll (no background threads, no hardware) while
    `running` is True.
    """

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False,
        unique=True
    )

    running = db.Column(
        db.Boolean,
        default=True
    )

    interval_seconds = db.Column(
        db.Integer,
        default=3
    )

    # Cumulative daily step counter (resets when the date rolls over)
    last_steps = db.Column(
        db.Integer,
        default=0
    )

    step_date = db.Column(db.Date)

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class WearableReading(db.Model):
    """
    One synthetic vital snapshot from the simulated device.
    """

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    device = db.Column(
        db.String(100),
        default="HealTrack Band"
    )

    heart_rate = db.Column(db.Float)

    spo2 = db.Column(db.Float)

    # Cumulative steps for the current day
    steps = db.Column(db.Integer)

    sleep_hours = db.Column(db.Float)

    sleep_quality = db.Column(db.String(30))

    activity_level = db.Column(db.String(30))

    calories = db.Column(db.Integer)

    recorded_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )
