import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CaretakerRegister.css";

function CaretakerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    relationship: "",
    patientId: "",
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

    const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Password and Confirm Password must match.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/register/caretaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Caretaker Registration Successful!");
        navigate("/login");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Could not connect to server. Please make sure the backend is running.");
      console.error(error);
    }
  };

  return (
    <div className="caretaker-register-page">

      <div className="caretaker-register-card">

        <h1>HealTrack AI</h1>

        <p className="tagline">
          Your recovery, our support
        </p>

        <h2>Caretaker Registration</h2>

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

          {/* Relationship with Patient */}
          <div className="input-group">
            <label>Relationship with Patient</label>

            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Relationship
              </option>

              <option value="Parent">Parent</option>
              <option value="Spouse">Spouse</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Relative">Relative</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Patient ID */}
          <div className="input-group">
            <label>Patient ID</label>

            <input
              type="text"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              placeholder="Enter Patient ID"
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

          {/* Register Button */}
          <button
            type="submit"
            className="register-submit-btn"
          >
            Register as Caretaker
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

export default CaretakerRegister;