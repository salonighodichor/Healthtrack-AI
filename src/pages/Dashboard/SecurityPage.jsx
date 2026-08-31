import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../api";
import "./SettingsPage.css";

function SecurityPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
  });

  const [contactForm, setContactForm] = useState({
    email: "",
    phone: "",
    current_password: "",
  });

  const [deletePassword, setDeletePassword] = useState("");

  // Change Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${API_BASE}/api/patient/${userId}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordForm),
        }
      );

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        setPasswordForm({
          old_password: "",
          new_password: "",
        });
      }
    } catch (error) {
      alert("Could not connect to server.");
    }
  };

  // Update Email / Phone
  const handleContactUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${API_BASE}/api/patient/${userId}/contact`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactForm),
        }
      );

      const data = await res.json();
      alert(data.message);
    } catch (error) {
      alert("Could not connect to server.");
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert("Please enter your password.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete your account?")) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/patient/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: deletePassword,
          }),
        }
      );

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        localStorage.removeItem("userId");
        navigate("/login");
      }
    } catch (error) {
      alert("Could not connect to server.");
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* Header */}
        <div className="settings-header">
          <button
            className="back-btn"
            onClick={() => navigate("/patient/settings")}
          >
            ← Back
          </button>

          <h1>🔐 Security & Privacy</h1>
          <p>Manage your account security and personal information</p>
        </div>

        {/* Change Password */}
        <div className="security-section">
          <h2>🔑 Change Password</h2>

          <form onSubmit={handlePasswordChange}>
            <div className="security-form">

              <div className="input-group">
                <label>Old Password</label>
                <input
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      old_password: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value,
                    })
                  }
                  required
                />
              </div>

            </div>

            <button type="submit" className="save-details-btn">
              Update Password
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="security-section">
          <h2>📧 Update Email / Phone</h2>

          <form onSubmit={handleContactUpdate}>
            <div className="security-form">

              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      phone: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={contactForm.current_password}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      current_password: e.target.value,
                    })
                  }
                  required
                />
              </div>

            </div>

            <button type="submit" className="save-details-btn">
              Update Contact Info
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="security-section delete-section">
          <h2>⚠️ Delete Account</h2>

          <p>
            This action is permanent and cannot be undone.
          </p>

          <div className="input-group">
            <label>Confirm Password</label>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>

          <button
            className="delete-btn"
            onClick={handleDeleteAccount}
          >
            Delete My Account
          </button>
        </div>

      </div>
    </div>
  );
}

export default SecurityPage;