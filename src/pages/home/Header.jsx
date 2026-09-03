import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <div className="nav">

        {/* BRAND */}
        <Link to="/" className="brand">
          <div className="brand-mark">+</div>

          <div>
            <div className="brand-name">HealTrack AI</div>
            <div className="brand-tag">
              Your Health, Our Priority
            </div>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav className="nav-links">
          <Link to="/" className="active">
            Home
          </Link>

          <a href="#services">Services</a>
          <a href="#features">Features</a>
          <a href="#ai-module">AI module</a>
        </nav>

        {/* ACTION BUTTONS */}
        <div className="nav-actions">

          {/* EMERGENCY */}
          <Link
            to="/Emergency"
            className="btn btn-outline"
          >
            📞 Emergency
          </Link>

          {/* LOGIN */}
          <Link
            to="/login"
            className="btn btn-primary"
          >
            Log in →
          </Link>

        </div>

      </div>
    </header>
  );
}