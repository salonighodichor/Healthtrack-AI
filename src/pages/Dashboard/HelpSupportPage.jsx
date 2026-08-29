import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

function HelpSupportPage() {
  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How do I update my health information?",
      answer:
        "Go to Settings → Health Preferences and update your information.",
    },
    {
      question: "How can I change my password?",
      answer:
        "Go to Settings → Security & Privacy → Change Password.",
    },
    {
      question: "How do I manage notifications?",
      answer:
        "Go to Settings → Notifications and choose the notifications you want to receive.",
    },
    {
      question: "How do I change the language?",
      answer:
        "Go to Settings → Language and select your preferred language.",
    },
    {
      question: "How can I contact support?",
      answer:
        "You can contact the HealTrack support team using the support contact information provided below.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
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

          <h1>❓ Help & Support</h1>
          <p>Find answers and get help with HealTrack</p>
        </div>

        {/* FAQ */}
        <div className="security-section">
          <h2>❓ Frequently Asked Questions</h2>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div className="faq-item" key={index}>

                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>

                  <span>
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>

                {openFaq === index && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="security-section">
          <h2>📞 Contact Support</h2>

          <p className="support-text">
            If you are facing any problem with HealTrack,
            you can contact our support team.
          </p>

          <div className="support-card">
            <div>
              <strong>📧 Email Support</strong>
              <p>support@healtrack.ai</p>
            </div>

            <div>
              <strong>🕐 Support Hours</strong>
              <p>Monday – Friday, 9:00 AM – 6:00 PM</p>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="security-section">
          <h2>ℹ️ About HealTrack</h2>

          <p className="support-text">
            HealTrack is a smart health management platform
            designed to help patients manage their health
            information, reminders and AI-assisted health
            guidance.
          </p>

          <p className="version-text">
            Version 1.0.0
          </p>
        </div>

      </div>
    </div>
  );
}

export default HelpSupportPage;