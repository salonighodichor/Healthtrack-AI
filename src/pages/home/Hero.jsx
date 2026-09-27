import { Link } from "react-router-dom"; 
import heroImage from "../../assets/hero.png"; 
 
export default function Hero() { 
  return ( 
    <section className="hero"> 
 
      {/* Background decoration */} 
      <div className="hero-bg-shape"></div> 
      <div className="hero-bg-circle"></div> 
 
      <div className="wrap hero-grid"> 
 
        {/* LEFT SIDE */} 
        <div className="hero-content"> 
 
          <div className="eyebrow"> 
            <span className="eyebrow-dot"></span> 
            AI-Powered Care Platform 
          </div> 
 
          <h1> 
            Smart AI Powered{" "} 
            <span className="accent">Personalized</span> 
            <br /> 
            Healthcare Management System 
          </h1> 
 
          <p className="lead"> 
            AI-driven platform to manage health, appointments, medications 
            and recovery with personalized care. 
          </p> 
 
          <div className="hero-ctas"> 
 
            <Link 
              to="/create-account" 
              className="btn btn-primary hero-btn" 
            > 
              Create your account → 
            </Link> 
 
            <a 
              href="#services" 
              className="btn btn-outline hero-btn" 
            > 
              <span className="play-icon">▶</span> 
              See how it works 
            </a> 
 
          </div> 
 
          <div className="pill-row"> 
 
            <span className="pill"> 
              🧑 For Patients 
            </span> 
 
            <span className="pill"> 
              🩺 For Doctors 
            </span> 
 
            <span className="pill"> 
              🤝 For Caretakers 
            </span> 
 
          </div> 
 
        </div> 
 
 
        {/* RIGHT SIDE */} 
        <div className="hero-visual"> 
 
          {/* Soft background glow */} 
          <div className="image-glow"></div> 
 
          {/* Main healthcare image */} 
          <div className="hero-image-box"> 
 
            <img 
              src={heroImage} 
              alt="Healthcare and AI" 
              className="hero-image" 
            /> 
 
          </div> 
 
          {/* AI floating card */} 
          <div className="floating-card ai-card"> 
 
            <div className="floating-icon"> 
              ✨ 
            </div> 
 
            <div> 
              <strong>AI Insights</strong> 
              <p>Personalized health suggestions</p> 
            </div> 
 
          </div> 
 
 
          {/* Security floating card */} 
          <div className="floating-card secure-card"> 
 
            <div className="secure-icon"> 
              🛡️ 
            </div> 
 
            <div> 
              <strong>Your Data is Safe</strong> 
              <p>Secure • Private • Confidential</p> 
            </div> 
 
          </div> 
 
        </div> 
 
      </div> 
 
 
      {/* FEATURE SECTION */} 
      <div className="feature-wrapper"> 
 
        <div className="feature-strip"> 
 
          <div className="feature-item"> 
 
            <div className="feature-icon"> 
              ✨ 
            </div> 
 
            <div> 
              <h4>AI-Powered Insights</h4> 
              <p> 
                Get smart health insights and recommendations. 
              </p> 
            </div> 
 
          </div> 
 
 
          <div className="feature-item"> 
 
            <div className="feature-icon"> 
              📅 
            </div> 
 
            <div> 
              <h4>Easy Appointments</h4> 
              <p> 
                Book and manage your appointments easily. 
              </p> 
            </div> 
 
          </div> 
 
 
          <div className="feature-item"> 
 
            <div className="feature-icon"> 
              💊 
            </div> 
 
            <div> 
              <h4>Medication Reminders</h4> 
              <p> 
                Never miss your medicine with smart reminders. 
              </p> 
            </div> 
 
          </div> 
 
 
          <div className="feature-item"> 
 
            <div className="feature-icon"> 
              🛡️ 
            </div> 
 
            <div> 
              <h4>Secure & Private</h4> 
              <p> 
                Your health data stays protected. 
              </p> 
            </div> 
 
          </div> 
 
        </div> 
 
      </div> 
 
    </section> 
  ); 
} 