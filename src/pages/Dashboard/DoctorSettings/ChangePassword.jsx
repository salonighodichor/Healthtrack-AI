import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";

function ChangePassword() {
  const navigate = useNavigate();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    alert("Password changed successfully!");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="change-password-container">

      <div className="change-password-header">

        <button
          className="back-settings-btn"
          onClick={() => navigate("/doctor/settings")}
        >
          ← Back
        </button>

        <h1>Change Password</h1>

        <p>
          Update your account password to keep your account secure.
        </p>

      </div>

      <div className="change-password-card">

        <form onSubmit={handleChangePassword}>

          <div className="password-group">
            <label>Current Password</label>

            <div className="password-input-wrapper">

              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />

              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? "Hide" : "Show"}
              </button>

            </div>
          </div>


          <div className="password-group">
            <label>New Password</label>

            <div className="password-input-wrapper">

              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />

              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? "Hide" : "Show"}
              </button>

            </div>
          </div>


          <div className="password-group">
            <label>Confirm New Password</label>

            <div className="password-input-wrapper">

              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>

            </div>
          </div>


          <button
            type="submit"
            className="change-password-btn"
          >
            Change Password
          </button>

        </form>

      </div>

    </div>
  );
}

export default ChangePassword;