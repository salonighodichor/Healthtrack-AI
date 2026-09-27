import { useEffect, useState } from "react";
import { API_BASE } from "../../api";
import "./Phase1.css";

/**
 * Phase-1 Core — Gamification panel.
 *
 * Wraps:
 *   GET  /api/gamification/<user_id>
 *   POST /api/gamification/<user_id>/award  {"action","points"}
 *   POST /api/gamification/<user_id>/badge  {"badge_name"}
 *
 * Shown as the "Earnings" tab inside Phase1Hub.
 */
export default function Phase1Gamification({ userId, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState("");

  const load = () => {
    if (!userId) return;
    fetch(`${API_BASE}/api/gamification/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError("Could not load gamification state.");
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const award = (action, points) => {
    setReport("");
    fetch(`${API_BASE}/api/gamification/${userId}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, points }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setReport(d.error);
        else {
          setReport(
            `+${d.points_awarded} points (${d.total_points} total, ${d.streak_days} day streak).`
          );
          load();
          if (onRefresh) onRefresh();
        }
      })
      .catch(() => setReport("Award failed."));
  };

  const badges = Array.isArray(data?.badges) ? data.badges : [];

  return (
    <div className="phase1-card">
      <div className="phase1-widgets">
        <div className="phase1-widget">
          <span className="phase1-widget-num">{data?.total_points ?? 0}</span>
          <span>points</span>
        </div>
        <div className="phase1-widget">
          <span className="phase1-widget-num">{data?.streak_days ?? 0}</span>
          <span>day streak</span>
        </div>
        <div className="phase1-widget">
          <span className="phase1-widget-num">{badges.length}</span>
          <span>badges</span>
        </div>
      </div>

      {report && <div className="phase1-report">{report}</div>}
      {error && <div className="phase1-error">{error}</div>}

      <div className="phase1-quickactions">
        <button type="button" onClick={() => award("checkin_streak", 15)}>
          🔥 +15 (streak)
        </button>
        <button type="button" onClick={() => award("daily_checkin", 10)}>
          ✅ +10 (check-in)
        </button>
      </div>

      <div className="phase1-badge-grid">
        {badges.length === 0 ? (
          <p className="phase1-empty">
            No badges yet — keep checking in to earn your first one!
          </p>
        ) : (
          badges.map((b) => (
            <div className="phase1-badge" key={`${b.name}-${b.awarded_at}`}>
              <div className="phase1-badge-emoji">{b.icon || "🎖️"}</div>
              <div className="phase1-badge-name">{b.name}</div>
              <div className="phase1-badge-desc">
                {b.description || "Achievement unlocked."}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
