import { useState } from "react";
import "./LoginScreen.css";

const DEMO_PASSWORD = "1111";

const ROLES = [
  { key: "Admin", desc: "Full system access" },
  { key: "Lecturer", desc: "Train models & score classes" },
  { key: "Viewer", desc: "Read-only cohort overview" },
];

const ORBIT_ITEMS = [
  { icon: "grid", name: "Dashboard", desc: "Live risk breakdown", className: "orbit-tl" },
  { icon: "upload", name: "CSV Upload", desc: "Historical & current data", className: "orbit-tr" },
  { icon: "bolt", name: "Retraining", desc: "Reset & retrain on demand", className: "orbit-ml" },
  { icon: "chart", name: "Analytics", desc: "Trends across cohorts", className: "orbit-mr" },
  { icon: "user", name: "Student Records", desc: "Full academic history", className: "orbit-bl" },
  { icon: "shield", name: "Role Access", desc: "Admin · Lecturer · Viewer", className: "orbit-br" },
];

function OrbitIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "upload":
      return <svg {...common}><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>;
    case "bolt":
      return <svg {...common}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>;
    case "chart":
      return <svg {...common}><path d="M4 19V9M11 19V4M18 19v-7" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /></svg>;
    default:
      return null;
  }
}

function LoginScreen({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError("Select a role to continue.");
      return;
    }
    if (password !== DEMO_PASSWORD) {
      setError("Incorrect password.");
      return;
    }
    onLogin(selectedRole);
  };

  return (
    <div className="login-container">
      {/* Left Panel – Orbit Feature Display */}
      <div className="features-panel">
        <div className="features-content">
          <p className="intro-text">
            RiskWatch connects lecturers, coordinators, and academic affairs to one shared
            early-warning view — flagging at-risk students before end-of-semester grading.
          </p>

          <div className="orbit-wrap">
            <div className="orbit-ring" />
            {ORBIT_ITEMS.map((item) => (
              <div className={`orbit-card ${item.className}`} key={item.name}>
                <span className="orbit-icon"><OrbitIcon name={item.icon} /></span>
                <div>
                  <span className="orbit-name">{item.name}</span>
                  <span className="orbit-desc">{item.desc}</span>
                </div>
              </div>
            ))}
            <div className="hub-card">
              <span className="hub-icon">◈</span>
              <span className="hub-name">RiskWatch</span>
              <span className="hub-sub">Early warning hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel – Login Form */}
      <div className="login-panel">
        <div className="login-wrapper">
          <div className="login-header">
            <span className="login-icon">◈</span>
            <div>
              <h2>RiskWatch</h2>
              <p className="login-sub">Early Warning System · GCTU</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Select Role</label>
              <div className="role-grid">
                {ROLES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className={`role-btn ${selectedRole === r.key ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedRole(r.key);
                      setError("");
                    }}
                  >
                    <span className="role-btn-name">{r.key}</span>
                    <span className="role-btn-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn">
              <span>→</span> Sign In
            </button>
          </form>

          <div className="login-badges">
            <span className="badge-item"><span className="badge-check">✓</span> Role-based access control</span>
            <span className="badge-item"><span className="badge-lock">🔒</span> Local demo session only</span>
          </div>

          <p className="login-footer-text">
            RiskWatch flags at-risk students early using academic and behavioural data, so
            lecturers can intervene before end-of-semester grading.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;