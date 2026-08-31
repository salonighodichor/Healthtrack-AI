import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../api";
import "./PatientDetails.css";

function PatientDetails() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [patient, setPatient] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    age: "",
    gender: "",
    recovery_type: "",
    emergency_contact: "",
    height: "",
    weight: "",
    blood_group: "",
    address: "",
    medical_conditions: "",
    allergies: "",
    current_medications: "",
    previous_surgery: "",
    medical_history: ""
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/patient/${patientId}`
        );

        const data = await response.json();

        if (response.ok) {
          setPatient({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            dob: data.dob || "",
            age: data.age || "",
            gender: data.gender || "",
            recovery_type: data.recovery_type || "",
            emergency_contact: data.emergency_contact || "",
            height: data.height || "",
            weight: data.weight || "",
            blood_group: data.blood_group || "",
            address: data.address || "",
            medical_conditions: data.medical_conditions || "",
            allergies: data.allergies || "",
            current_medications: data.current_medications || "",
            previous_surgery: data.previous_surgery || "",
            medical_history: data.medical_history || ""
          });
        } else {
          alert(data.message || "Patient not found");
        }
      } catch (error) {
        console.error(error);
        alert("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPatient((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE}/api/patient/${patientId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            height: patient.height,
            weight: patient.weight,
            blood_group: patient.blood_group,
            address: patient.address,
            medical_conditions: patient.medical_conditions,
            allergies: patient.allergies,
            current_medications: patient.current_medications,
            previous_surgery: patient.previous_surgery,
            medical_history: patient.medical_history
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Patient details saved successfully!");
      } else {
        alert(data.message || "Failed to save details.");
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to backend.");
    }
  };

  if (loading) {
    return <div className="patient-details-loading">Loading...</div>;
  }

  return (
    <div className="patient-details-page">

      <div className="patient-details-card">

        <div className="details-header">
          <button
            className="back-btn"
            onClick={() => navigate("/patient")}
          >
            ← Back
          </button>

          <h1>👤 Patient Details</h1>
          <p>View and update your complete health information</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Personal Information */}
          <div className="details-section">
            <h2>👤 Personal Information</h2>

            <div className="details-grid">

              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={patient.name}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={patient.email}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={patient.phone}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={patient.dob}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Age</label>
                <input
                  type="text"
                  value={patient.age}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Gender</label>
                <input
                  type="text"
                  value={patient.gender}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Recovery Type</label>
                <input
                  type="text"
                  value={patient.recovery_type}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Emergency Contact</label>
                <input
                  type="text"
                  value={patient.emergency_contact}
                  readOnly
                />
              </div>

              <div className="input-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={patient.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="3"
                />
              </div>

            </div>
          </div>


          {/* Physical Information */}
          <div className="details-section">
            <h2>📏 Physical Information</h2>

            <div className="details-grid">

              <div className="input-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={patient.height}
                  onChange={handleChange}
                  placeholder="Enter height"
                />
              </div>

              <div className="input-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={patient.weight}
                  onChange={handleChange}
                  placeholder="Enter weight"
                />
              </div>

              <div className="input-group">
                <label>Blood Group</label>

                <select
                  name="blood_group"
                  value={patient.blood_group}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

            </div>
          </div>


          {/* Medical Information */}
          <div className="details-section">
            <h2>🩺 Medical Information</h2>

            <div className="details-grid">

              <div className="input-group full-width">
                <label>Medical Conditions</label>
                <textarea
                  name="medical_conditions"
                  value={patient.medical_conditions}
                  onChange={handleChange}
                  placeholder="Enter any medical conditions"
                  rows="3"
                />
              </div>

              <div className="input-group full-width">
                <label>Allergies</label>
                <textarea
                  name="allergies"
                  value={patient.allergies}
                  onChange={handleChange}
                  placeholder="Enter allergies, if any"
                  rows="3"
                />
              </div>

              <div className="input-group full-width">
                <label>Current Medications</label>
                <textarea
                  name="current_medications"
                  value={patient.current_medications}
                  onChange={handleChange}
                  placeholder="Enter current medications"
                  rows="3"
                />
              </div>

              <div className="input-group full-width">
                <label>Previous Surgery</label>
                <textarea
                  name="previous_surgery"
                  value={patient.previous_surgery}
                  onChange={handleChange}
                  placeholder="Enter previous surgery details"
                  rows="3"
                />
              </div>

              <div className="input-group full-width">
                <label>Medical History</label>
                <textarea
                  name="medical_history"
                  value={patient.medical_history}
                  onChange={handleChange}
                  placeholder="Enter medical history"
                  rows="4"
                />
              </div>

            </div>
          </div>


          <div className="details-actions">
            <button
              type="submit"
              className="save-details-btn"
            >
              💾 Save Details
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}

export default PatientDetails;