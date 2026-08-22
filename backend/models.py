from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(15))
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # patient / doctor / caretaker

    # Patient-specific fields
    dob = db.Column(db.String(20))
    age = db.Column(db.String(5))
    gender = db.Column(db.String(20))
    recovery_type = db.Column(db.String(50))
    emergency_contact = db.Column(db.String(15))

    # Doctor-specific fields
    medical_registration_no = db.Column(db.String(50))
    specialization = db.Column(db.String(50))
    hospital_clinic = db.Column(db.String(100))
    experience = db.Column(db.String(20))
    address = db.Column(db.Text)

    # Caretaker-specific fields
    relationship = db.Column(db.String(30))
    patient_id = db.Column(db.String(50))