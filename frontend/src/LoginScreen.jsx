import { useState } from "react";
import "./LoginScreen.css";

const ROLES = [
  { key: "Admin", desc: "Full system access" },
  { key: "Lecturer", desc: "View assigned courses & alerts" },
  { key: "Viewer", desc: "Read-only cohort overview" },
];

const DEMO_PASSWORD = "1111";

function LoginScreen({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError("Select a role first.");
      return;
    }
    if (password !== DEMO_PASSWORD) {
      setError("Incorrect password.");
      return;
    }
    onLogin(selectedRole);
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">&#9670;</span>
          <div>
            <div className="login-title">RiskWatch</div>
            <div className="login-sub mono">EWS &middot; GCTU</div>
          </div>
        </div>

        <p className="login-instruction">Select your role to continue</p>

        <div className="role-grid">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`role-card ${selectedRole === r.key ? "selected" : ""}`}
              onClick={() => {
                setSelectedRole(r.key);
                setError("");
              }}
            >
              <span className="role-name">{r.key}</span>
              <span className="role-desc">{r.desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn">
            Sign in
          </button>
        </form>

        <p className="login-note mono">Demo mode &middot; not for real student data</p>
      </div>
    </div>
  );
}

export default LoginScreen;