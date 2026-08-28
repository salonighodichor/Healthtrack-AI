import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Help.css";

function Help() {
  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState(null);

  const handleContactSupport = () => {
    alert("Support team will contact you soon.");
  };

  const toggleFaq = (faqNumber) => {
    setOpenFaq(openFaq === faqNumber ? null : faqNumber);
  };

  return (
    <div className="help-container">

      <div className="help-header">

        <button
          className="back-settings-btn"
          onClick={() => navigate("/doctor/settings")}
        >
          ← Back
        </button>

        <h1>Help & Support</h1>
        <p>Get help with your account or report an issue.</p>

      </div>

      <div className="help-card">

        <div className="help-section">
          <h2>Need Help?</h2>

          <p>
            If you are facing any problem with the doctor dashboard,
            appointments, notifications, or account settings,
            you can contact our support team.
          </p>
        </div>

        <div className="help-section">
          <h2>Frequently Asked Questions</h2>

          {/* FAQ 1 */}
          <div className="faq-item">

            <div
              className="faq-question"
              onClick={() => toggleFaq(1)}
            >
              <h3>How can I change my password?</h3>

              <span>
                {openFaq === 1 ? "▼" : "▶"}
              </span>
            </div>

            {openFaq === 1 && (
              <p>
                Go to Settings → Change Password and update your password.
              </p>
            )}

          </div>


          {/* FAQ 2 */}
          <div className="faq-item">

            <div
              className="faq-question"
              onClick={() => toggleFaq(2)}
            >
              <h3>How can I change my availability?</h3>

              <span>
                {openFaq === 2 ? "▼" : "▶"}
              </span>
            </div>

            {openFaq === 2 && (
              <p>
                Go to Settings → Availability & Working Hours.
              </p>
            )}

          </div>


          {/* FAQ 3 */}
          <div className="faq-item">

            <div
              className="faq-question"
              onClick={() => toggleFaq(3)}
            >
              <h3>How can I manage notifications?</h3>

              <span>
                {openFaq === 3 ? "▼" : "▶"}
              </span>
            </div>

            {openFaq === 3 && (
              <p>
                Go to Settings → Notifications and choose your preferences.
              </p>
            )}

          </div>

        </div>


        <div className="contact-support">

          <h2>Contact Support</h2>

          <p>
            Still need help? Contact our support team.
          </p>

          <button
            className="contact-support-btn"
            onClick={handleContactSupport}
          >
            Contact Support
          </button>

        </div>

      </div>

    </div>
  );
}

export default Help;