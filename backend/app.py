from flask import Flask, request, jsonify
from models import db, User
from flask_cors import CORS

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///healtrack.db"
db.init_app(app)
CORS(app)

@app.route("/")
def home():
    return {"message": "HealTrack backend is running! 🚀"}

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

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

    new_patient = User(
        name=data.get("fullName"),
        email=data.get("email"),
        phone=data.get("phone"),
        password=data.get("password"),
        role="patient",
        dob=data.get("dob"),
        age=data.get("age"),
        gender=data.get("gender"),
        recovery_type=data.get("recoveryType"),
        emergency_contact=data.get("emergencyContact"),
    )

    db.session.add(new_patient)
    db.session.commit()

    return jsonify({"message": "Patient Registration Successful!"}), 201
@app.route("/api/register/doctor", methods=["POST"])
def register_doctor():
    data = request.get_json()

    new_doctor = User(
        name=data.get("fullName"),
        email=data.get("email"),
        phone=data.get("phone"),
        password=data.get("password"),
        role="doctor",
        medical_registration_no=data.get("medicalRegistrationNo"),
        specialization=data.get("specialization"),
        hospital_clinic=data.get("hospitalClinic"),
        experience=data.get("experience"),
        address=data.get("address"),
    )

    db.session.add(new_doctor)
    db.session.commit()

    return jsonify({"message": "Doctor Registration Successful!"}), 201
@app.route("/api/register/caretaker", methods=["POST"])
def register_caretaker():
    data = request.get_json()

    new_caretaker = User(
        name=data.get("fullName"),
        email=data.get("email"),
        phone=data.get("phone"),
        password=data.get("password"),
        role="caretaker",
        relationship=data.get("relationship"),
        patient_id=data.get("patientId"),
    )

    db.session.add(new_caretaker)
    db.session.commit()

    return jsonify({"message": "Caretaker Registration Successful!"}), 201
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

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)