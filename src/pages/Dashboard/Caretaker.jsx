import { useState } from "react"; 
import "./Caretaker.css"; 
 
export default function Caretaker() { 
  const [activeMenu, setActiveMenu] = useState("Dashboard"); 
  const [darkMode, setDarkMode] = useState(false); 
 
  const menuItems = [ 
    ["🏠", "Dashboard"], 
    ["👤", "Connected Patient"], 
    ["📈", "Recovery Progress"], 
    ["📅", "Appointments"], 
    ["🔔", "Important Alerts"], 
    ["🩺", "Health Records"], 
    ["🤖", "AI Inside"], 
  ]; 
 
  return ( 
    <div className={`caretaker-dashboard ${darkMode ? "dark-mode" : ""}`}> 
 
      {/* ================= SIDEBAR ================= */} 
 
      <aside className="caretaker-sidebar"> 
 
        <div className="caretaker-brand"> 
          <div className="caretaker-brand-icon">💜</div> 
 
          <div className="caretaker-brand-text"> 
            <span>HealTrack AI</span> 
            <small>Caretaker Support</small> 
          </div> 
        </div> 
 
        <p className="caretaker-menu-title">MAIN MENU</p> 
 
        <div className="caretaker-sidebar-menu"> 
 
          {menuItems.map(([icon, name]) => ( 
            <button 
              key={name} 
              className={`caretaker-menu-item ${ 
                activeMenu === name ? "active" : "" 
              }`} 
              onClick={() => setActiveMenu(name)} 
            > 
              <span className="caretaker-menu-icon">{icon}</span> 
              <span>{name}</span> 
            </button> 
          ))} 
 
        </div> 
 
        <div className="caretaker-sidebar-bottom"> 
 
          <button className="caretaker-bottom-button"> 
            ⚙️ 
            <span>Settings</span> 
          </button> 
 
          <button className="caretaker-logout-button"> 
            🚪 
            <span>Logout</span> 
          </button> 
 
        </div> 
      </aside> 
 
 
      {/* ================= MAIN ================= */} 
 
      <main className="caretaker-main-content"> 
 
        {/* HEADER */} 
 
        <header className="caretaker-header"> 
 
          <div className="caretaker-search"> 
            🔍 
            <input 
              type="text" 
              placeholder="Search patient, records..." 
            /> 
          </div> 
 
          <div className="caretaker-header-right"> 
 
            <button 
              className="caretaker-mode-button" 
              onClick={() => setDarkMode(!darkMode)} 
            > 
              {darkMode ? "☀️" : "🌙"} 
            </button> 
 
            <button className="caretaker-notification"> 
              🔔 
              <span></span> 
            </button> 
 
            <div className="caretaker-profile"> 
 
              <div className="caretaker-avatar"> 
                SK 
              </div> 
 
              <div> 
                <strong>Sarah Khan</strong> 
                <small>Caretaker</small> 
              </div> 
 
            </div> 
 
          </div> 
        </header> 
 
 
        {/* ================= CONTENT ================= */} 
 
        <div className="caretaker-container"> 
 
          {/* WELCOME */} 
 
          <section className="caretaker-welcome"> 
 
            <div> 
              <p className="caretaker-welcome-small"> 
                CARETAKER DASHBOARD 
              </p> 
 
              <h1>Welcome back, Sarah 👋</h1> 
 
              <p> 
                Stay connected with your patient's recovery 
                and health journey. 
              </p> 
            </div> 
 
            <button className="caretaker-primary-button"> 
              View Patient 
            </button> 
 
          </section> 
 
 
          {/* ================================================= 
              DASHBOARD 
          ================================================= */} 
 
          {activeMenu === "Dashboard" && ( 
            <> 
 
              {/* TOP GRID */} 
 
              <div className="caretaker-top-grid"> 
 
                {/* CONNECTED PATIENT */} 
 
                <section className="caretaker-card"> 
 
                  <div className="caretaker-card-title"> 
                    <div> 
                      <h2>Connected Patient</h2> 
                      <p>Currently monitoring</p> 
                    </div> 
                  </div> 
 
                  <div className="connected-patient"> 
 
                    <div className="patient-large-avatar"> 
                      AS 
                    </div> 
 
                    <div className="connected-patient-info"> 
                      <h3>Aditya Sharma</h3> 
 
                      <p>Age 42 • Recovery Care</p> 
 
                      <span>Connected</span> 
                    </div> 
 
                    <div className="online-status"> 
                      ● Online 
                    </div> 
 
                  </div> 
 
                  <button className="caretaker-outline-button"> 
                    View Patient Profile 
                  </button> 
 
                </section> 
 
 
                {/* RECOVERY */} 
 
                <section className="caretaker-card"> 
 
                  <div className="caretaker-card-title"> 
                    <div> 
                      <h2>Recovery Progress</h2> 
                      <p>Overall patient recovery</p> 
                    </div> 
 
                    <span>Today</span> 
                  </div> 
 
                  <div className="caretaker-progress"> 
 
                    <div className="caretaker-progress-circle"> 
 
                      <div> 
                        <strong>78%</strong> 
                        <small>Recovered</small> 
                      </div> 
 
                    </div> 
 
                    <div className="progress-details"> 
 
                      <div className="progress-row"> 
                        <span>Physical Activity</span> 
                        <strong>82%</strong> 
                      </div> 
 
                      <div className="caretaker-progress-bar"> 
                        <div style={{ width: "82%" }}></div> 
                      </div> 
 
 
                      <div className="progress-row"> 
                        <span>Medication</span> 
                        <strong>90%</strong> 
                      </div> 
 
                      <div className="caretaker-progress-bar"> 
                        <div style={{ width: "90%" }}></div> 
                      </div> 
 
 
                      <div className="progress-row"> 
                        <span>Recovery Goals</span> 
                        <strong>68%</strong> 
                      </div> 
 
                      <div className="caretaker-progress-bar"> 
                        <div style={{ width: "68%" }}></div> 
                      </div> 
 
                    </div> 
 
                  </div> 
 
                </section> 
 
              </div> 
 
 
              {/* MIDDLE */} 
 
              <div className="caretaker-middle-grid"> 
 
                {/* APPOINTMENTS */} 
 
                <section className="caretaker-card"> 
 
                  <div className="caretaker-card-title"> 
                    <div> 
                      <h2>Upcoming Appointments</h2> 
                      <p>Next scheduled visits</p> 
                    </div> 
                  </div> 
 
                  <div className="caretaker-appointment"> 
 
                    <div className="appointment-date"> 
                      <strong>24</strong> 
                      <span>AUG</span> 
                    </div> 
 
                    <div> 
                      <strong>Dr. Rahul Mehta</strong> 
                      <p>Cardiology • 10:30 AM</p> 
                      <small>City Care Hospital</small> 
                    </div> 
 
                    <span className="appointment-status"> 
                      Upcoming 
                    </span> 
 
                  </div> 
 
 
                  <div className="caretaker-appointment"> 
 
                    <div className="appointment-date"> 
                      <strong>29</strong> 
                      <span>AUG</span> 
                    </div> 
 
                    <div> 
                      <strong>Dr. Neha Patel</strong> 
                      <p>Physiotherapy • 04:00 PM</p> 
                      <small>Recovery Clinic</small> 
                    </div> 
 
                    <span className="appointment-status"> 
                      Scheduled 
                    </span> 
 
                  </div> 
 
                </section> 
 
 
                {/* ALERTS */} 
 
                <section className="caretaker-card"> 
 
                  <div className="caretaker-card-title"> 
                    <div> 
                      <h2>Important Alerts</h2> 
                      <p>Things that need attention</p> 
                    </div> 
 
                    <div className="alert-count"> 
                      3 
                    </div> 
                  </div> 
 
 
                  <div className="caretaker-alert warning"> 
 
                    <span>⚠️</span> 
 
                    <div> 
                      <strong>Medicine Reminder</strong> 
                      <p> 
                        Evening medicine is due at 8:00 PM. 
                      </p> 
                    </div> 
 
                  </div> 
 
 
                  <div className="caretaker-alert info"> 
 
                    <span>ℹ️</span> 
 
                    <div> 
                      <strong>Doctor's Note</strong> 
                      <p> 
                        Patient should maintain daily activity. 
                      </p> 
                    </div> 
 
                  </div> 
 
 
                  <div className="caretaker-alert success"> 
 
                    <span>✓</span> 
 
                    <div> 
                      <strong>Recovery Goal Completed</strong> 
                      <p> 
                        Today's walking goal has been completed. 
                      </p> 
                    </div> 
 
                  </div> 
 
                </section> 
 
              </div> 
 
 
              {/* LOWER */} 
 
              <div className="caretaker-lower-grid"> 
 
                {/* HEALTH RECORDS */} 
 
                <section className="caretaker-card"> 
 
                  <div className="caretaker-card-title"> 
                    <div> 
                      <h2>Recent Health Records</h2> 
                      <p>Latest patient readings</p> 
                    </div> 
                  </div> 
 
 
                  <div className="health-record"> 
 
                    <div className="record-icon"> 
                      ❤️ 
                    </div> 
 
                    <div> 
                      <strong>Heart Rate</strong> 
                      <p>72 BPM • Today, 9:20 AM</p> 
                    </div> 
 
                    <span>Normal</span> 
 
                  </div> 
 
 
                  <div className="health-record"> 
 
                    <div className="record-icon"> 
                      🩸 
                    </div> 
 
                    <div> 
                      <strong>Blood Pressure</strong> 
                      <p>120/80 mmHg • Today</p> 
                    </div> 
 
                    <span>Normal</span> 
 
                  </div> 
 
 
                  <div className="health-record"> 
 
                    <div className="record-icon"> 
                      🍬 
                    </div> 
 
                    <div> 
                      <strong>Blood Sugar</strong> 
                      <p>104 mg/dL • Yesterday</p> 
                    </div> 
 
                    <span>Normal</span> 
 
                  </div> 
 
                </section> 
 
 
                {/* AI */} 
 
                <section className="caretaker-card ai-insights-card"> 
 
                  <div className="caretaker-card-title"> 
 
                    <div> 
                      <h2>AI Inside</h2> 
                      <p>Smart recovery insights</p> 
                    </div> 
 
                    <div className="ai-insights-icon"> 
                      🤖 
                    </div> 
 
                  </div> 
 
 
                  <div className="ai-insight-message"> 
 
                    <strong> 
                      AI Recovery Insight 
                    </strong> 
 
                    <p> 
                      Aditya's recovery is progressing steadily. 
                      Medication adherence is good and activity 
                      levels have improved this week. 
                    </p> 
 
                    <div className="ai-insight-tip"> 
                      💡 Keep monitoring daily activity and 
                      medicine timings. 
                    </div> 
 
                    <button className="caretaker-ai-button"> 
                      View AI Analysis 
                    </button> 
 
                  </div> 
 
                </section> 
 
              </div> 
 
            </> 
          )} 
 
 
          {/* ================================================= 
              CONNECTED PATIENT 
          ================================================= */} 
 
          {activeMenu === "Connected Patient" && ( 
 
            <> 
 
              <div className="caretaker-page-heading"> 
                <h1>Connected Patient</h1> 
                <p>Complete information about your connected patient</p> 
              </div> 
 
              <div className="patient-details-grid"> 
 
                <section className="caretaker-card patient-profile-large"> 
 
                  <div className="patient-large-avatar"> 
                    AS 
                  </div> 
 
                  <h2>Aditya Sharma</h2> 
 
                  <p>42 Years • Male</p> 
 
                  <span className="patient-connected-badge"> 
                    ● Connected 
                  </span> 
 
                  <div className="patient-info-list"> 
 
                    <div> 
                      <span>Recovery Type</span> 
                      <strong>Post Surgery</strong> 
                    </div> 
 
                    <div> 
                      <span>Email</span> 
                      <strong>aditya@example.com</strong> 
                    </div> 
 
                    <div> 
                      <span>Emergency Contact</span> 
                      <strong>+91 98XXXXXX45</strong> 
                    </div> 
 
                  </div> 
 
                </section> 
 
 
                <section className="caretaker-card"> 
 
                  <div className="caretaker-card-title"> 
                    <div> 
                      <h2>Patient Health Overview</h2> 
                      <p>Current health status</p> 
                    </div> 
                  </div> 
 
                  <div className="health-overview-grid"> 
 
                    <div> 
                      <span>❤️</span> 
                      <strong>72</strong> 
                      <small>Heart Rate</small> 
                    </div> 
 
                    <div> 
                      <span>🩸</span> 
                      <strong>120/80</strong> 
                      <small>Blood Pressure</small> 
                    </div> 
 
                    <div> 
                      <span>🍬</span> 
                      <strong>104</strong> 
                      <small>Blood Sugar</small> 
                    </div> 
 
                    <div> 
                      <span>🌡️</span> 
                      <strong>98.4°F</strong> 
                      <small>Temperature</small> 
                    </div> 
 
                  </div> 
 
                </section> 
 
              </div> 
 
            </> 
          )} 
 
 
          {/* ================================================= 
              RECOVERY PROGRESS 
          ================================================= */} 
 
          {activeMenu === "Recovery Progress" && ( 
 
            <> 
 
              <div className="caretaker-page-heading"> 
                <h1>Recovery Progress</h1> 
                <p>Monitor your patient's recovery journey</p> 
              </div> 
 
              <section className="caretaker-card"> 
 
                <div className="full-recovery"> 
 
                  <div className="caretaker-progress-circle large-progress"> 
 
                    <div> 
                      <strong>78%</strong> 
                      <small>Overall Recovery</small> 
                    </div> 
 
                  </div> 
 
                  <div className="recovery-goals"> 
 
                    <h2>Recovery Goals</h2> 
 
                    <p>Physical Activity — 82%</p> 
                    <div className="caretaker-progress-bar"> 
                      <div style={{ width: "82%" }}></div> 
                    </div> 
 
                    <p>Medication Adherence — 90%</p> 
                    <div className="caretaker-progress-bar"> 
                      <div style={{ width: "90%" }}></div> 
                    </div> 
 
                    <p>Daily Exercises — 74%</p> 
                    <div className="caretaker-progress-bar"> 
                      <div style={{ width: "74%" }}></div> 
                    </div> 
 
                    <p>Recovery Milestones — 68%</p> 
                    <div className="caretaker-progress-bar"> 
                      <div style={{ width: "68%" }}></div> 
                    </div> 
 
                  </div> 
 
                </div> 
 
              </section> 
 
            </> 
          )} 
 
 
          {/* ================================================= 
              APPOINTMENTS 
          ================================================= */} 
 
          {activeMenu === "Appointments" && ( 
 
            <> 
 
              <div className="caretaker-page-heading"> 
                <h1>Appointments</h1> 
                <p>Manage and track patient appointments</p> 
              </div> 
 
              <section className="caretaker-card"> 
 
                <div className="caretaker-appointment"> 
 
                  <div className="appointment-date"> 
                    <strong>24</strong> 
                    <span>AUG</span> 
                  </div> 
 
                  <div> 
                    <strong>Dr. Rahul Mehta</strong> 
                    <p>Cardiology • 10:30 AM</p> 
                    <small>City Care Hospital</small> 
                  </div> 
 
                  <span className="appointment-status"> 
                    Upcoming 
                  </span> 
 
                </div> 
 
 
                <div className="caretaker-appointment"> 
 
                  <div className="appointment-date"> 
                    <strong>29</strong> 
                    <span>AUG</span> 
                  </div> 
 
                  <div> 
                    <strong>Dr. Neha Patel</strong> 
                    <p>Physiotherapy • 04:00 PM</p> 
                    <small>Recovery Clinic</small> 
                  </div> 
 
                  <span className="appointment-status"> 
                    Scheduled 
                  </span> 
 
                </div> 
 
              </section> 
 
            </> 
 
          )} 
 
 
          {/* ================================================= 
              ALERTS 
          ================================================= */} 
 
          {activeMenu === "Important Alerts" && ( 
 
            <> 
 
              <div className="caretaker-page-heading"> 
                <h1>Important Alerts</h1> 
                <p>Important notifications regarding your patient</p> 
              </div> 
 
              <section className="caretaker-card"> 
 
                <div className="caretaker-alert warning"> 
                  <span>⚠️</span> 
 
                  <div> 
                    <strong>Medicine Reminder</strong> 
                    <p> 
                      Evening medicine is due at 8:00 PM. 
                    </p> 
                  </div> 
                </div> 
 
 
                <div className="caretaker-alert info"> 
                  <span>ℹ️</span> 
 
                  <div> 
                    <strong>Doctor's Note</strong> 
                    <p> 
                      Patient should maintain daily activity. 
                    </p> 
                  </div> 
                </div> 
 
 
                <div className="caretaker-alert success"> 
                  <span>✓</span> 
 
                  <div> 
                    <strong>Recovery Goal Completed</strong> 
                    <p> 
                      Today's walking goal has been completed. 
                    </p> 
                  </div> 
                </div> 
 
              </section> 
 
            </> 
 
          )} 
 
 
          {/* ================================================= 
              HEALTH RECORDS 
          ================================================= */} 
 
          {activeMenu === "Health Records" && ( 
 
            <> 
 
              <div className="caretaker-page-heading"> 
                <h1>Health Records</h1> 
                <p>Monitor your patient's recent health readings</p> 
              </div> 
 
              <section className="health-overview-grid full-health-grid"> 
 
                <div className="health-big-card"> 
                  ❤️ 
                  <strong>72 BPM</strong> 
                  <span>Heart Rate</span> 
                  <small>Normal</small> 
                </div> 
 
                <div className="health-big-card"> 
                  🩸 
                  <strong>120/80</strong> 
                  <span>Blood Pressure</span> 
                  <small>Normal</small> 
                </div> 
 
                <div className="health-big-card"> 
                  🍬 
                  <strong>104 mg/dL</strong> 
                  <span>Blood Sugar</span> 
                  <small>Normal</small> 
                </div> 
 
                <div className="health-big-card"> 
                  🌡️ 
                  <strong>98.4°F</strong> 
                  <span>Temperature</span> 
                  <small>Normal</small> 
                </div> 
 
              </section> 
 
            </> 
 
          )} 
 
 
          {/* ================================================= 
              AI INSIDE 
          ================================================= */} 
 
          {activeMenu === "AI Inside" && ( 
 
            <> 
 
              <div className="caretaker-page-heading"> 
                <h1>AI Inside</h1> 
                <p>AI-powered insights for better patient support</p> 
              </div> 
 
              <section className="caretaker-card ai-full-card"> 
 
                <div className="ai-insights-icon"> 
                  🤖 
                </div> 
 
                <h2>AI Recovery Analysis</h2> 
 
                <p> 
                  Aditya's recovery is progressing steadily. 
                  Current health readings are within normal 
                  range and medication adherence is good. 
                </p> 
 
                <div className="ai-insight-tip"> 
                  💡 Caretaker Tip: Continue monitoring daily 
                  activity, medication timings and upcoming 
                  appointments. 
                </div> 
 
                <button className="caretaker-primary-button"> 
                  Run New AI Analysis 
                </button> 
 
              </section> 
 
            </> 
 
          )} 
 
        </div> 
 
      </main> 
 
    </div> 
  ); 
} 