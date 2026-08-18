import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorRegister.css";

function DoctorRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    medicalRegistrationNo: "",
    specialization: "",
    hospitalClinic: "",
    experience: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Password and Confirm Password must match.");
      return;
    }

    console.log("Doctor Registration Data:", formData);

    alert("Doctor Registration Successful!");

    // Later we can connect this to backend
    // navigate("/login");
  };

  return (
    <div className="doctor-register-page">

      <div className="doctor-register-card">

        <h1>HealTrack AI</h1>

        <p className="tagline">
          Your recovery, our support
        </p>

        <h2>Doctor Registration</h2>

        <form onSubmit={handleSubmit}>

          {/* Full Name */}
          <div className="input-group">
            <label>Full Name</label>

            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter Full Name"
              required
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email Address"
              required
            />
          </div>

          {/* Phone */}
          <div className="input-group">
            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter Phone Number"
              maxLength="10"
              pattern="[0-9]{10}"
              required
            />
          </div>

          {/* Medical Registration Number */}
          <div className="input-group">
            <label>Medical Registration No.</label>

            <input
              type="text"
              name="medicalRegistrationNo"
              value={formData.medicalRegistrationNo}
              onChange={handleChange}
              placeholder="Enter Medical Registration Number"
              required
            />
          </div>

          {/* Specialization */}
          <div className="input-group">
            <label>Specialization</label>

            <select
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
            >
              <option value="">Select Specialization</option>

              <option value="General Physician">
                General Physician
              </option>

              <option value="Cardiologist">
                Cardiologist
              </option>

              <option value="Dermatologist">
                Dermatologist
              </option>

              <option value="Neurologist">
                Neurologist
              </option>

              <option value="Orthopedic">
                Orthopedic
              </option>

              <option value="Pediatrician">
                Pediatrician
              </option>

              <option value="Psychiatrist">
                Psychiatrist
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          {/* Hospital / Clinic Name */}
          <div className="input-group">
            <label>Hospital / Clinic Name</label>

            <input
              type="text"
              name="hospitalClinic"
              value={formData.hospitalClinic}
              onChange={handleChange}
              placeholder="Enter Hospital / Clinic Name"
              required
            />
          </div>

          {/* Experience */}
          <div className="input-group">
            <label>Experience</label>

            <input
              type="text"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g. 5 years"
              required
            />
          </div>

          {/* Permanent Address */}
          <div className="input-group">
            <label>Permanent Address</label>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter Permanent Address"
              rows="3"
              required
            ></textarea>
          </div>

          {/* Password */}
          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create Password"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label>Confirm Password</label>

            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="register-submit-btn"
          >
            Register as Doctor
          </button>

          {/* Back Button */}
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>

        </form>

      </div>

    </div>
  );
}

export default DoctorRegister;