import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Forgotpage.css";

function Forgotpage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
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

  // STEP 1 - Send OTP
  const handleSendOTP = (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      alert("Please enter your Email or Phone Number.");
      return;
    }

    alert("OTP sent successfully!");

    setStep(2);
  };

  // STEP 2 - Verify OTP
  const handleVerifyOTP = (e) => {
    e.preventDefault();

    if (!formData.otp.trim()) {
      alert("Please enter OTP.");
      return;
    }

    if (formData.otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    alert("OTP verified successfully!");

    setStep(3);
  };

  // STEP 3 - Reset Password
  const handleResetPassword = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Password and Confirm Password must match.");
      return;
    }

    alert("Password reset successfully!");

    navigate("/login");
  };

  return (
    <div className="forgot-password-page">

      <div className="forgot-password-card">

        {/* HEADER */}

        <h1>HealTrack AI</h1>

        <p className="tagline">
          Your recovery, our support
        </p>


        {/* STEP 1 */}

        {step === 1 && (
          <>
            <h2>Forgot Password?</h2>

            <p className="forgot-subtitle">
              Enter your registered Email or Phone Number
            </p>

            <form onSubmit={handleSendOTP}>

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

              <button
                type="submit"
                className="forgot-submit-btn"
              >
                Send OTP
              </button>

            </form>
          </>
        )}


        {/* STEP 2 */}

        {step === 2 && (
          <>
            <h2>Verify OTP</h2>

            <p className="forgot-subtitle">
              Enter the 6-digit OTP sent to your registered contact
            </p>

            <form onSubmit={handleVerifyOTP}>

              <div className="input-group">

                <label>Enter OTP</label>

                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  inputMode="numeric"
                  required
                />

              </div>

              <button
                type="submit"
                className="forgot-submit-btn"
              >
                Verify OTP
              </button>

            </form>
          </>
        )}


        {/* STEP 3 */}

        {step === 3 && (
          <>
            <h2>Reset Password</h2>

            <p className="forgot-subtitle">
              Create a new password for your account
            </p>

            <form onSubmit={handleResetPassword}>

              <div className="input-group">

                <label>New Password</label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter New Password"
                  required
                />

              </div>


              <div className="input-group">

                <label>Confirm Password</label>

                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm New Password"
                  required
                />

              </div>


              <button
                type="submit"
                className="forgot-submit-btn"
              >
                Reset Password
              </button>

            </form>
          </>
        )}


        {/* BACK TO LOGIN */}

        <button
  type="button"
  className="forgot-password"
  onClick={() => navigate("/forgot-password")}
>
  Forgot Password?
</button>

      </div>

    </div>
  );
}

export default Forgotpage;