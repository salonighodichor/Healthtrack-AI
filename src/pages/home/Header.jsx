import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <div className="nav">
        <Link to="/" className="brand">
          <div className="brand-mark">+</div>
          <div>
            <div className="brand-name">HealTrack AI</div>
            <div className="brand-tag">Your Health, Our Priority</div>
          </div>
        </Link>

        <nav className="nav-links">
          <a href="#" className="active">Home</a>
          <a href="#services">Services</a>
          <a href="#features">Features</a>
          <a href="#ai-module">AI module</a>
        </nav>

        <div className="nav-actions">
          <a href="#" className="btn btn-outline">📞 Emergency</a>
          <Link to="/login" className="btn btn-primary">Log in →</Link>
        </div>
      </div>
    </header>
  );
}