// App.jsx
import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import LoginScreen from "./LoginScreen";
import StudentDetail from "./StudentDetail";
import UploadModal from "./UploadModal";
import "./App.css";

const RISK_TONE = { High: "tone-high", Moderate: "tone-moderate", Low: "tone-low" };
const RISK_HEX = { High: "#d44c3c", Moderate: "#e68a2e", Low: "#2a9d6e" };

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "grid" },
  { key: "students", label: "Students", icon: "users" },
  { key: "alerts", label: "Alerts", icon: "bell" },
  { key: "reports", label: "Reports", icon: "file" },
  { key: "settings", label: "Settings", icon: "gear" },
];

const PAGE_SIZE = 12;

function NavIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "grid":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" /><circle cx="17.5" cy="9" r="2.4" /><path d="M15.5 14.2c2.5.2 4.3 2.2 4.3 5" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 16v-5a6 6 0 1 0-12 0v5l-1.6 2.4A1 1 0 0 0 5.2 20h13.6a1 1 0 0 0 .8-1.6L18 16Z" /><path d="M10.3 22a1.8 1.8 0 0 0 3.4 0" /></svg>;
    case "file":
      return <svg {...common}><path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" /><path d="M14 2.5V7h4" /><path d="M8 12.5h8M8 16.5h8" /></svg>;
    case "gear":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.7 7.7 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9c.8.7 1.6 1.2 2.6 1.5L10 21.5h4l.5-2.5a7.7 7.7 0 0 0 2.6-1.5l2.3.9 2-3.4-2-1.5Z" /></svg>;
    default:
      return null;
  }
}

function App() {
  const [role, setRole] = useState(() => localStorage.getItem("riskwatch_role") || null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [activeNav, setActiveNav] = useState("overview");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleLogin = (selectedRole) => {
    localStorage.setItem("riskwatch_role", selectedRole);
    setRole(selectedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("riskwatch_role");
    setRole(null);
  };

  const fetchStudents = () => {
    fetch("http://127.0.0.1:5000/api/students/")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch students");
        return res.json();
      })
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Risk now comes straight from the API's trained Random Forest model
  // (risk_category / risk_probability), not a frontend threshold rule.
  const studentsWithRisk = useMemo(
    () => students.map((s) => ({ ...s, risk: s.risk_category || "Unknown" })),
    [students]
  );

  const riskCounts = useMemo(() => {
    const counts = { High: 0, Moderate: 0, Low: 0 };
    studentsWithRisk.forEach((s) => {
      if (counts[s.risk] !== undefined) counts[s.risk]++;
    });
    return counts;
  }, [studentsWithRisk]);

  const total = students.length || 1;
  const atRiskShare = Math.round(((riskCounts.High + riskCounts.Moderate) / total) * 100);

  const donutData = ["High", "Moderate", "Low"].map((level) => ({
    name: level,
    value: riskCounts[level],
  }));

  const gpaByProgram = useMemo(() => {
    const groups = {};
    studentsWithRisk.forEach((s) => {
      if (!s.program) return;
      if (!groups[s.program]) groups[s.program] = { total: 0, count: 0 };
      groups[s.program].total += Number(s.avg_gpa) || 0;
      groups[s.program].count += 1;
    });
    return Object.entries(groups).map(([program, { total, count }]) => ({
      program,
      avgGpa: Math.round((total / count) * 100) / 100,
    }));
  }, [studentsWithRisk]);

  const scatterByRisk = useMemo(() => {
    const groups = { High: [], Moderate: [], Low: [] };
    studentsWithRisk.forEach((s) => {
      if (!groups[s.risk]) return; // skip "Unknown" risk students in the scatter plot
      groups[s.risk].push({
        attendance: s.avg_attendance,
        gpa: s.avg_gpa,
        name: s.full_name,
      });
    });
    return groups;
  }, [studentsWithRisk]);

  const filtered = studentsWithRisk.filter((s) => {
    const matchesRisk = riskFilter === "All" || s.risk === riskFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.student_number?.toLowerCase().includes(q) ||
      s.program?.toLowerCase().includes(q);
    return matchesRisk && matchesQuery;
  });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, riskFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (!role) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="shell">
        <div className="boot-screen">
          <div className="boot-pulse" />
          <p className="mono">Loading student records&hellip;</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell">
        <div className="boot-screen error">
          <p className="mono">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <div>
            <div className="brand-name">RiskWatch</div>
            <div className="brand-sub mono">EWS &middot; GCTU</div>
          </div>
        </div>

        <nav className="side-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`side-nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => setActiveNav(item.key)}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{role[0]}</div>
          <div>
            <div className="sidebar-footer-name">{role}</div>
            <div className="sidebar-footer-role mono">Demo session</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out">
            &#10162;
          </button>
        </div>
      </aside>

      <main className="main">
        {selectedStudentId ? (
          <StudentDetail
            studentId={selectedStudentId}
            onBack={() => setSelectedStudentId(null)}
          />
        ) : (
          <>
            <header className="topbar">
              <div>
                <h1>Overview</h1>
                <p className="topbar-sub">Cohort risk snapshot, updated on load</p>
              </div>
              <div className="topbar-status">
                <span className="live-dot" />
                <span className="mono">{students.length} tracked</span>
                <button className="upload-trigger-btn" onClick={() => setShowUpload(true)}>
                  Upload CSV
                </button>
              </div>
            </header>

            <section className="stat-row">
              <div className="stat-card" style={{ animationDelay: "0s" }}>
                <span className="stat-label">Total Students</span>
                <span className="stat-value">{students.length}</span>
              </div>
              <div className="stat-card tone-high" style={{ animationDelay: "0.06s" }}>
                <span className="stat-label">High Risk</span>
                <span className="stat-value">{riskCounts.High}</span>
              </div>
              <div className="stat-card tone-moderate" style={{ animationDelay: "0.12s" }}>
                <span className="stat-label">Moderate Risk</span>
                <span className="stat-value">{riskCounts.Moderate}</span>
              </div>
              <div className="stat-card tone-low" style={{ animationDelay: "0.18s" }}>
                <span className="stat-label">Low Risk</span>
                <span className="stat-value">{riskCounts.Low}</span>
              </div>
            </section>

            <section className="grid-main">
              <div className="panel panel-hero" style={{ animationDelay: "0.1s" }}>
                <div className="panel-heading">
                  <div>
                    <h2>Risk Map</h2>
                    <p className="panel-note">Attendance vs. GPA &mdash; colored by the model's predicted risk category</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      type="number"
                      dataKey="attendance"
                      name="Attendance"
                      unit="%"
                      domain={[0, 100]}
                      stroke="#6b7e9c"
                      tick={{ fontSize: 11, fill: "#6b7e9c" }}
                    />
                    <YAxis
                      type="number"
                      dataKey="gpa"
                      name="GPA"
                      domain={[0, 4]}
                      stroke="#6b7e9c"
                      tick={{ fontSize: 11, fill: "#6b7e9c" }}
                    />
                    <ReferenceLine x={65} stroke="#c89b3c" strokeDasharray="4 4" />
                    <ReferenceLine y={2.5} stroke="#c89b3c" strokeDasharray="4 4" />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "#1a2639" }}
                      itemStyle={{ color: "#1a2639" }}
                    />
                    {["High", "Moderate", "Low"].map((level) => (
                      <Scatter key={level} name={level} data={scatterByRisk[level]} fill={RISK_HEX[level]} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="spectrum-legend">
                  {["High", "Moderate", "Low"].map((level) => (
                    <span className="legend-item" key={level}>
                      <span className={`legend-dot ${RISK_TONE[level]}`} />
                      {level}
                    </span>
                  ))}
                </div>
              </div>

              <div className="panel-stack">
                <div className="panel panel-donut" style={{ animationDelay: "0.16s" }}>
                  <div className="panel-heading">
                    <h2>Risk Share</h2>
                  </div>
                  <div className="donut-wrap">
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <defs>
                          {donutData.map((entry) => (
                            <linearGradient id={`grad-${entry.name}`} key={entry.name} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={RISK_HEX[entry.name]} stopOpacity={1} />
                              <stop offset="100%" stopColor={RISK_HEX[entry.name]} stopOpacity={0.55} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {donutData.map((entry) => (
                            <Cell key={entry.name} fill={`url(#grad-${entry.name})`} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <span className="donut-value">{atRiskShare}%</span>
                      <span className="donut-label mono">flagged</span>
                    </div>
                  </div>
                </div>

                <div className="panel panel-bar" style={{ animationDelay: "0.22s" }}>
                  <div className="panel-heading">
                    <h2>Avg GPA by Program</h2>
                  </div>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={gpaByProgram} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c89b3c" stopOpacity={1} />
                          <stop offset="100%" stopColor="#a67c2e" stopOpacity={0.75} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="program" stroke="#6b7e9c" tick={{ fontSize: 10, fill: "#6b7e9c" }} interval={0} angle={-20} textAnchor="end" height={45} />
                      <YAxis domain={[0, 4]} stroke="#6b7e9c" tick={{ fontSize: 11, fill: "#6b7e9c" }} />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                        contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12 }}
                        labelStyle={{ color: "#1a2639" }}
                        itemStyle={{ color: "#c89b3c" }}
                      />
                      <Bar dataKey="avgGpa" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="panel panel-table" style={{ animationDelay: "0.28s" }}>
              <div className="panel-heading">
                <h2>At-Risk Student List</h2>
                <div className="panel-controls">
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Search name, ID, program&hellip;"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                    <option value="All">All Risk Levels</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="table-wrap">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Student #</th>
                      <th>Name</th>
                      <th>Program</th>
                      <th>Level</th>
                      <th>Avg GPA</th>
                      <th>Avg Attendance</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((s, i) => (
                      <tr
                        key={s.student_id}
                        className="clickable-row"
                        onClick={() => setSelectedStudentId(s.student_id)}
                        style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s` }}
                      >
                        <td className="mono">{s.student_number}</td>
                        <td className="name-cell">{s.full_name}</td>
                        <td>{s.program}</td>
                        <td>{s.level}</td>
                        <td>{s.avg_gpa}</td>
                        <td>{s.avg_attendance}%</td>
                        <td>
                          <span className={`risk-pill ${RISK_TONE[s.risk] || ""}`}>{s.risk}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <div className="empty-state">No students match this search.</div>}
              </div>

              {filtered.length > 0 && (
                <div className="table-footer">
                  <span className="table-footer-count mono">
                    Showing {visible.length} of {filtered.length}
                  </span>
                  {hasMore && (
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    >
                      Load more students
                    </button>
                  )}
                  {!hasMore && visibleCount > PAGE_SIZE && (
                    <button className="load-more-btn ghost" onClick={() => setVisibleCount(PAGE_SIZE)}>
                      Show less
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadComplete={fetchStudents}
        />
      )}
    </div>
  );
}

export default App;