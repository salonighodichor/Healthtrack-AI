import "./Home.css";

function Home() {
  return (
    <div className="home-page">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          🩺 HealthTrack <span>AI</span>
        </div>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </div>

        <button className="login-btn">Login</button>
      </nav>

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">
          <p className="small-title">SMART HEALTHCARE WITH AI</p>

          <h1>
            Your Health,
            <br />
            <span>Smarter with AI</span>
          </h1>

          <p className="hero-text">
            Monitor your health, understand your medical information,
            and get smart AI-powered health insights in one place.
          </p>

          <div className="hero-buttons">
            <button className="get-started">
              Get Started
            </button>

            <button className="learn-more">
              Learn More
            </button>
          </div>
        </div>

        <div className="hero-image">
          <div className="doctor-card">
            <div className="doctor-icon">👨‍⚕️</div>
            <h3>AI Health Assistant</h3>
            <p>Smart & Personalized Healthcare</p>
          </div>
        </div>

      </section>

      {/* Features */}
      <section className="features" id="features">

        <h2>Everything You Need for Better Health</h2>

        <p className="section-text">
          HealthTrack AI brings your important health tools together.
        </p>

        <div className="feature-container">

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Health Analysis</h3>
            <p>
              Get intelligent insights from your health information.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3>Health Monitoring</h3>
            <p>
              Keep track of important health information easily.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Health Reports</h3>
            <p>
              View and understand your health reports in one place.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💊</div>
            <h3>Medicine Tracking</h3>
            <p>
              Manage your medicines and keep track of your schedule.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;