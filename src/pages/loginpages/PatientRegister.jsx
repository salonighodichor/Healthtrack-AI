import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientRegister.css";

function PatientRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    recoveryType: "",
    emergencyContact: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Calculate age automatically from Date of Birth
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();

      const monthDifference =
        today.getMonth() - birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
          today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      setFormData((prevData) => ({
        ...prevData,
        age: age.toString(),
      }));
    }
  }, [formData.dob]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Password and Confirm Password must match.");
      return;
    }

    console.log("Patient Registration Data:", formData);

    alert("Patient Registration Successful!");

    // Later we can connect this to backend
    // navigate("/login");
  };

  return (
    <div className="patient-register-page">

      <div className="patient-register-card">

        <h1>HealTrack AI</h1>

        <p className="tagline">
          Your recovery, our support
        </p>

        <h2>Patient Registration</h2>

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


          {/* Date of Birth */}
          <div className="input-group">
            <label>Date of Birth</label>

            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>


          {/* Age */}
          <div className="input-group">
            <label>Age</label>

            <input
              type="text"
              name="age"
              value={formData.age}
              placeholder="Age"
              readOnly
            />
          </div>


          {/* Gender */}
          <div className="input-group">
            <label>Gender</label>

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
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


          {/* Recovery Type */}
          <div className="input-group">
            <label>Recovery Type</label>

            <select
              name="recoveryType"
              value={formData.recoveryType}
              onChange={handleChange}
              required
            >
              <option value="">Select Recovery Type</option>
              <option value="Post Surgery">
                Post Surgery
              </option>
              <option value="Chronic Disease">
                Chronic Disease
              </option>
              <option value="Injury">
                Injury
              </option>
              <option value="Medication Recovery">
                Medication Recovery
              </option>
              <option value="Other">
                Other
              </option>
            </select>
          </div>


          {/* Emergency / Caretaker Contact */}
          <div className="input-group">
            <label>Emergency / Caretaker Contact</label>

            <input
              type="tel"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="Enter Emergency / Caretaker Contact"
              maxLength="10"
              pattern="[0-9]{10}"
              required
            />
          </div>


          {/* Register Button */}
          <button
            type="submit"
            className="register-submit-btn"
          >
            Register
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

export default PatientRegister;