import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [role, setRole] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!role) {
      alert("Please select your role.");
      return;
    }

    console.log("Login Data:", {
      ...formData,
      role,
      rememberMe,
    });

    alert(`${role} Login Successful!`);

    // Later connect with backend
    // navigate("/dashboard");
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Header */}

        <h1>HealTrack AI</h1>

        <p className="tagline">
          Your recovery, our support
        </p>

        <h2>Welcome Back</h2>

        <p className="login-subtitle">
          Login to your account
        </p>


        <form onSubmit={handleSubmit}>

          {/* Email / Phone */}

          <div className="input-group">

            <label>Email / Phone Number</label>

            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email or Phone Number"
              required
            />

          </div>


          {/* Password */}

          <div className="input-group">

            <label>Password</label>

            <div className="password-wrapper">

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>

            </div>

          </div>


          {/* Remember + Forgot */}

          <div className="login-options">

            <label className="remember-me">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>Remember me</span>

            </label>


            {/* FIXED FORGOT PASSWORD */}

            <button
              type="button"
              className="forgot-password"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </button>

          </div>


          {/* Role */}

          <div className="role-section">

            <label>Login as</label>

            <div className="role-buttons">

              <button
                type="button"
                className={`role-btn ${
                  role === "Patient" ? "active" : ""
                }`}
                onClick={() => setRole("Patient")}
              >
                Patient
              </button>

              <button
                type="button"
                className={`role-btn ${
                  role === "Doctor" ? "active" : ""
                }`}
                onClick={() => setRole("Doctor")}
              >
                Doctor
              </button>

              <button
                type="button"
                className={`role-btn ${
                  role === "Caretaker" ? "active" : ""
                }`}
                onClick={() => setRole("Caretaker")}
              >
                Caretaker
              </button>

            </div>

          </div>


          {/* Login Button */}

          <button
            type="submit"
            className="login-submit-btn"
          >
            Login
          </button>


          {/* Create Account */}

          <p className="create-account-text">

            Don't have an account?{" "}

            <button
              type="button"
              className="create-account-link"
              onClick={() => navigate("/")}
            >
              Create Account
            </button>

          </p>

        </form>

      </div>

    </div>
  );
}

export default Login;