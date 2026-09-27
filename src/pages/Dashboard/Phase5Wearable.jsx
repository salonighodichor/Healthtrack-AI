import { useCallback, useEffect, useState } from "react";
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
} from "recharts";
import "./Phase5.css";

const HEART_HIGH = 120;
const HEART_LOW = 50;
const SPO2_LOW = 92;
const SPO2_WARN = 94;

const INTERVAL_OPTIONS = [
  { value: 1, label: "1s" },
  { value: 3, label: "3s" },
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
];

/**
 * Phase-5 — Smart Health Monitoring.
 *
 * Wearable Device Simulator (no hardware) + Real-Time Health
 * Dashboard + abnormal-vitals alert generation. Polls the
 * /api/wearable/* endpoints; the backend lazily synthesizes
 * readings while the simulator is running.
 */
export default function Phase5Wearable({ userId }) {
  const [device, setDevice] = useState(null);
  const [current, setCurrent] = useState(null);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchReadings = useCallback(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/wearable/readings/${userId}?minutes=60`)
      .then((r) => r.json())
      .then((data) => {
        setCurrent(data.current || null);
        setReadings(Array.isArray(data.readings) ? data.readings : []);
      })
      .catch(() => {});
  }, [userId]);

  const fetchDevice = useCallback(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/wearable/device/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setDevice(data.device || null);
        setCurrent(data.today || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const fetchAlerts = useCallback(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/wearable/alerts/${userId}`)
      .then((r) => r.json())
      .then((data) => setAlerts(Array.isArray(data.alerts) ? data.alerts : []))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchDevice();
    fetchAlerts();
    fetchReadings();
  }, [fetchDevice, fetchAlerts, fetchReadings]);

  useEffect(() => {
    if (!device?.running) return;
    const id = setInterval(fetchReadings, 2000);
    return () => clearInterval(id);
  }, [device?.running, fetchReadings]);

  const updateSimulator = (payload, thenRefresh) => {
    if (!userId) return;
    fetch(`${API_BASE}/api/wearable/simulator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...payload }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.device) setDevice(data.device);
        if (thenRefresh) {
          fetchAlerts();
          fetchReadings();
        }
      })
      .catch(() => {});
  };

  const toggleRunning = () =>
    updateSimulator({ running: !device?.running }, true);

  const changeInterval = (sec) =>
    updateSimulator({ interval_seconds: sec }, false);

  const simulateNow = () => {
    if (!userId || sending) return;
    setSending(true);
    fetch(`${API_BASE}/api/wearable/reading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    })
      .then((r) => r.json())
      .then(() => {
        fetchReadings();
        fetchAlerts();
      })
      .catch(() => {})
      .finally(() => setSending(false));
  };

  const chartData = readings.map((r) => {
    const t = r.recorded_at ? new Date(r.recorded_at).toLocaleTimeString() : "";
    return {
      time: t,
      HeartRate: r.heart_rate,
      SpO2: r.spo2,
    };
  });

  const hrStatus = (v) =>
    v == null ? "ok" : v > HEART_HIGH || v < HEART_LOW ? "bad" : "ok";
  const spo2Status = (v) =>
    v == null ? "ok" : v < SPO2_LOW ? "bad" : v < SPO2_WARN ? "warn" : "ok";
  const stepsStatus = "ok";
  const sleepStatus = (h) => (h == null ? "ok" : h < 6 || h > 9.5 ? "warn" : "ok");

  const fmtTime = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (loading) {
    return <p className="p5-empty">Connecting to the wearable simulator...</p>;
  }

  return (
    <div className="page-stack">
      {/* ============ Device / Simulator ============ */}
      <div className="p5-card">
        <div className="p5-card-head">
          <span>⌚</span>
          <div>
            <h3>HealTrack Band — Wearable Simulator</h3>
            <p>
              Simulated device feed — heart rate, SpO2, steps and sleep. No
              external hardware required.
            </p>
          </div>
        </div>

        <div className="p5-toolbar">
          <span className={`p5-state-chip ${device?.running ? "running" : "stopped"}`}>
            <span className="p5-dot" />
            {device?.running ? "Streaming" : "Paused"}
          </span>

          <button
            className={device?.running ? "outline-button" : "primary-button"}
            type="button"
            onClick={toggleRunning}
          >
            {device?.running ? "⏸ Pause Stream" : "▶ Start Stream"}
          </button>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            Stream interval
            <select
              className="p5-select"
              value={device?.interval_seconds || 3}
              onChange={(e) => changeInterval(Number(e.target.value))}
              disabled={!device?.running}
            >
              {INTERVAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <button
            className="outline-button"
            type="button"
            onClick={simulateNow}
            disabled={sending}
            style={{ marginLeft: "auto" }}
          >
            {sending ? "..." : "⚡ Simulate Now"}
          </button>
        </div>
      </div>

      {/* ============ Live vitals ============ */}
      <div className="p5-card">
        <div className="p5-card-head">
          <span>📡</span>
          <div>
            <h3>Real-Time Health Dashboard</h3>
            <p>Latest simulated vitals, updated every few seconds.</p>
          </div>
        </div>

        <div className="p5-vitals">
          <div className={`p5-vital ${hrStatus(current?.heart_rate)}`}>
            <span className="p5-live-badge">LIVE</span>
            <span className="p5-vital-icon">❤️</span>
            <span className="p5-vital-value">
              {current?.heart_rate ?? "—"} <small>BPM</small>
            </span>
            <span className="p5-vital-label">Heart Rate</span>
            {hrStatus(current?.heart_rate) === "bad" && (
              <span className="p5-vital-unit">⚠ abnormal</span>
            )}
          </div>

          <div className={`p5-vital ${spo2Status(current?.spo2)}`}>
            <span className="p5-live-badge">LIVE</span>
            <span className="p5-vital-icon">🫁</span>
            <span className="p5-vital-value">
              {current?.spo2 ?? "—"} <small>%</small>
            </span>
            <span className="p5-vital-label">Blood Oxygen (SpO2)</span>
            {spo2Status(current?.spo2) !== "ok" && (
              <span className="p5-vital-unit">⚠ low</span>
            )}
          </div>

          <div className={`p5-vital ${stepsStatus}`}>
            <span className="p5-vital-icon">👟</span>
            <span className="p5-vital-value">
              {(current?.steps ?? 0).toLocaleString()}
            </span>
            <span className="p5-vital-label">Steps (today)</span>
          </div>

          <div className={`p5-vital ${sleepStatus(current?.sleep_hours)}`}>
            <span className="p5-vital-icon">😴</span>
            <span className="p5-vital-value">
              {current?.sleep_hours ?? "—"} <small>h</small>
            </span>
            <span className="p5-vital-label">
              Sleep · {current?.sleep_quality || "—"}
            </span>
          </div>
        </div>

        <div className="p5-chart">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee8" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="hr" domain={[30, 160]} tick={{ fontSize: 10 }} />
              <YAxis
                yAxisId="spo2"
                orientation="right"
                domain={[85, 100]}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="HeartRate"
                stroke="#e24c4c"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="spo2"
                type="monotone"
                dataKey="SpO2"
                stroke="#3a6ff0"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============ Abnormal vitals alerts ============ */}
      <div className="p5-card">
        <div className="p5-card-head">
          <span>🚨</span>
          <div>
            <h3>Abnormal Vitals Alerts</h3>
            <p>Warning alerts automatically generated for abnormal readings.</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <p className="p5-empty">
            No abnormal-vitals alerts yet. Keep an eye on the live cards —
            the simulator occasionally produces out-of-range readings.
          </p>
        ) : (
          alerts.map((a) => (
            <div className="p5-alert" key={a.id}>
              <span className="p5-alert-icon">⚠️</span>
              <div className="p5-alert-body">
                <strong>{a.title}</strong>
                <p>{a.message}</p>
              </div>
              <span className="p5-alert-time">{fmtTime(a.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}