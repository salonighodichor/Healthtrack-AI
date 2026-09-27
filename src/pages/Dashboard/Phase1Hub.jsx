import { useState } from "react";
import Phase1CheckIn from "./Phase1CheckIn.jsx";
import Phase1HealthScore from "./Phase1HealthScore.jsx";
import Phase1Gamification from "./Phase1Gamification.jsx";
import "./Phase1.css";

const HUB_TABS = [
  { key: "checkin", label: "📝 Daily Check-In" },
  { key: "score", label: "📊 Health Score" },
  { key: "game", label: "🎮 Gamification" },
];

/**
 * Phase-1 Hub — single mount point for the Phase-1 Core panels.
 *
 * Patient.jsx only needs ONE menu item + ONE case returning this
 * component; everything else stays in the Dashboard folder.
 *
 * userId is resolved from localStorage (same pattern as the rest of
 * the dashboard), while the backend Phase-1 routes are keyed by
 * user_id so no auth cookie gymnastics are required.
 */
export default function Phase1Hub() {
  const [tab, setTab] = useState("checkin");
  const userId = localStorage.getItem("userId");

  return (
    <section className="phase1-hub">
      <div className="page-heading">
        <h1>
          📅 Phase-1 Health Hub
        </h1>
        <p>
          Daily check-ins, your health score &amp; analytics, and the rewards
          you earn along the way.
        </p>
      </div>

      <nav className="phase1-hub-tabs" aria-label="Phase-1 sections">
        {HUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "checkin" && <Phase1CheckIn userId={userId} />}
      {tab === "score" && <Phase1HealthScore userId={userId} />}
      {tab === "game" && <Phase1Gamification userId={userId} />}
    </section>
  );
}
