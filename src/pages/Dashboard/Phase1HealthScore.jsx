import { useEffect, useState } from "react";
import { API_BASE } from "../../api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Phase-1 Core — Health Score & Analytics.
 *
 * Wraps GET /api/health-score/<user_id>, /api/health-score/<user_id>/history
 * and /api/analytics/<user_id> (all verified in the Phase-1 route suite).
 * Recharts renders the trend line, weekly bar breakdown and
 * score-vs-target donut.
 */
export default function Phase1HealthScore({ userId }) {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`${API_BASE}/api/health-score/${userId}`).then((r) => r.json()),
      fetch(`${API_BASE}/api/health-score/${userId}/history`).then((r) =>
        r.json()
      ),
      fetch(`${API_BASE}/api/analytics/${userId}`).then((r) => r.json()),
    ])
      .then(([scoreRes, histRes, anaRes]) => {
        setScore(scoreRes.health_score ?? scoreRes.score ?? null);
        setHistory(
          Array.isArray(histRes.history)
            ? histRes.history
            : Array.isArray(histRes)
            ? histRes
            : []
        );
        setAnalytics(anaRes);
      })
      .catch((err) => {
        console.error(
          "Failed to load health analytics for user",
          userId,
          "(health-score, history, analytics)",
          err
        );
        setError("Failed to load health analytics");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="phase1-loading">Loading analytics…</div>;
  if (error) return <div className="phase1-error">{error}</div>;

  const scoreValue = score?.total_score ?? score?.score;
  const target = score?.target_score ?? 70;

  const trendData = history
    .map((h) => ({
      date: h.recorded_date || h.date,
      score: h.total_score ?? h.score,
    }))
    .filter((d) => d.score != null);

  const barData = Array.isArray(history)
    ? history
        .map((h) => h.breakdown || h.components || null)
        .filter(Boolean)
        .slice()
        .reverse()
    : [];

  const pieData = score?.breakdown
    ? Object.entries(score.breakdown).map(([key, value]) => ({
        name: key.replace(/_/g, " "),
        value: typeof value === "number" ? value : Number(value) || 0,
      }))
    : [];

  const PIE_COLORS = ["#4f8ef7", "#42c57f", "#f7a04f", "#b06ef7", "#ef5b8f"];

  return (
    <div className="phase1-card">
      <div className="phase1-card-head">
        <span>📊</span>
        <div>
          <h3>Health Score &amp; Analytics</h3>
          <p>Trend over time, weekly activity and score composition.</p>
        </div>
      </div>

      <div className="phase1-score-banner">
        <div className="phase1-score-num">
          {scoreValue != null ? Math.round(scoreValue) : "—"}
          <small>/ {target}</small>
        </div>
        <div>
          <strong>
            {scoreValue != null && scoreValue >= target
              ? "🎉 On Target"
              : scoreValue != null
              ? "📈 Keep Going"
              : "No score yet"}
          </strong>
          <p>
            {score?.status_label ||
              (scoreValue != null && scoreValue >= target
                ? "You're meeting your recovery targets."
                : "Log check-ins and complete activities to improve.")}
          </p>
        </div>
      </div>

      {trendData.length > 0 && (
        <div className="phase1-chart">
          <h4>Score Trend</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 11 }} />
              <YAxis stroke="#999" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                name="Health Score"
                stroke="#4f8ef7"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {pieData.length > 0 && (
        <div className="phase1-chart phase1-donut">
          <h4>Score Composition</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                label={(entry) => `${entry.name} ${entry.value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {barData.length > 0 && (
        <div className="phase1-chart">
          <h4>Weekly Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 11 }} />
              <YAxis stroke="#999" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="hydration" fill="#42c57f" name="Hydration" />
              <Bar dataKey="sleep" fill="#4f8ef7" name="Sleep" />
              <Bar dataKey="medication" fill="#f7a04f" name="Medication" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics && (
        <div className="phase1-analytics-summary">
          {analytics.total_checkins != null && (
            <div className="phase1-kpi">
              <span className="phase1-kpi-num">{analytics.total_checkins}</span>
              <span>check-ins</span>
            </div>
          )}
          {analytics.avg_score != null && (
            <div className="phase1-kpi">
              <span className="phase1-kpi-num">
                {Math.round(analytics.avg_score)}
              </span>
              <span>avg score</span>
            </div>
          )}
          {analytics.adherence_rate != null && (
            <div className="phase1-kpi">
              <span className="phase1-kpi-num">
                {Math.round(analytics.adherence_rate * 100)}%
              </span>
              <span>adherence</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
