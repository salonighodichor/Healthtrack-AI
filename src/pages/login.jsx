import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api";
import "./login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save to localStorage
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userEmail", data.user.email || formData.email);

        // Clear form
        setFormData({ email: "", password: "" });

        // Redirect based on role
        if (role === "patient") {
          navigate("/patient");
        } else if (role === "doctor") {
          navigate("/doctor");
        } else if (role === "caretaker") {
          navigate("/caretaker");
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      setError("Could not connect to server. Make sure backend is running!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-left">
          <div className="brand-section">
            <div className="brand-icon">🏥</div>
            <h1>HealTrack AI</h1>
            <p>Post-Discharge Patient Care System</p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <span>✓</span>
              <p>Real-time Health Monitoring</p>
            </div>
            <div className="feature-item">
              <span>✓</span>
              <p>Doctor-Patient Connection</p>
            </div>
            <div className="feature-item">
              <span>✓</span>
              <p>Caretaker Support System</p>
            </div>
            <div className="feature-item">
              <span>✓</span>
              <p>AI-Powered Recommendations</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-right">
          <div className="login-box">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">❌ {error}</div>}

            {/* Role Selector */}
            <div className="role-selector-section">
              <label>Select Your Role</label>
              <div className="role-options">
                <button
                  type="button"
                  className={`role-btn ${role === "patient" ? "active" : ""}`}
                  onClick={() => setRole("patient")}
                >
                  👤 Patient
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === "doctor" ? "active" : ""}`}
                  onClick={() => setRole("doctor")}
                >
                  👨‍⚕️ Doctor
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === "caretaker" ? "active" : ""}`}
                  onClick={() => setRole("caretaker")}
                >
                  🤝 Caretaker
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">📧 Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">🔐 Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Sign In"}
              </button>
            </form>

            {/* Forgot Password & Sign Up Links */}
            <div className="login-footer">
              <a href="/forgot-password" className="forgot-link">
                Forgot Password?
              </a>
            </div>

            <div className="signup-section">
              <p>Don't have an account?</p>
              <div className="signup-links">
                <a href="/create-account">📝 Create Account</a>
                <a href="/doctor-register">👨‍⚕️ Register as Doctor</a>
                <a href="/caretaker-register">🤝 Register as Caretaker</a>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="demo-credentials">
              <p>🧪 Working Test Credentials:</p>
              <small>Patient: rani@example.com | Pass: rani123</small>
              <small>Doctor: ravi@healtrack.ai | Pass: doctor123</small>
              <small>Caretaker: asha@healtrack.ai | Pass: caretaker123</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;