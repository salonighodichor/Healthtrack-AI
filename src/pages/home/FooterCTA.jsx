import { Link } from "react-router-dom";

export default function FooterCTA() {
  return (
    <section className="wrap">
      <div className="footer-cta">
        <p>Built as a post-discharge coordination platform for patients, doctors, and caretakers.</p>
        <div className="hero-ctas">
          <Link to="/create-account" className="btn btn-light">Get started →</Link>
          <Link to="/login" className="btn btn-ghost-light">Log in</Link>
        </div>
      </div>
    </section>
  );
}