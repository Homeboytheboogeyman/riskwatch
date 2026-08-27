import { useState, useEffect } from "react";
import "./StudentDetail.css";

function StudentDetail({ studentId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:5000/api/students/${studentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load student record");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [studentId]);

  if (loading) {
    return (
      <div className="detail-shell">
        <div className="boot-pulse" />
        <p className="mono">Loading record&hellip;</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="detail-shell">
        <p className="mono">Error: {error || "No data"}</p>
        <button className="back-btn" onClick={onBack}>&larr; Back</button>
      </div>
    );
  }

  const risk = data.risk_category || "Unknown";
  const riskTone = risk.toLowerCase();
  const probabilityPct = data.risk_probability != null ? Math.round(data.risk_probability * 100) : null;

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>&larr; Back to cohort</button>

      <div className="record-card">
        <div className="record-header">
          <div className="record-id-block">
            <div className="record-avatar">{data.full_name?.[0] || "?"}</div>
            <div>
              <h1>{data.full_name}</h1>
              <p className="mono record-sub">{data.student_number} &middot; {data.program} &middot; Level {data.level}</p>
            </div>
          </div>
          <span className={`risk-pill-lg tone-${riskTone}`}>{risk} Risk</span>
        </div>

        <div className="record-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Email</span>
            <span className="meta-value mono">{data.email || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Enrolled</span>
            <span className="meta-value mono">{data.enrolled_date || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Avg GPA</span>
            <span className="meta-value mono">{data.avg_gpa ?? "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Avg Attendance</span>
            <span className="meta-value mono">{data.avg_attendance != null ? `${data.avg_attendance}%` : "—"}</span>
          </div>
        </div>
      </div>

      <div className="record-card">
        <h2 className="section-title">Academic Record</h2>
        <p className="section-note">
          Course-by-course entries used as inputs to the risk model — CA marks, attendance,
          submission rate, and LMS engagement.
        </p>
        <div className="table-wrap">
          <table className="record-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Semester</th>
                <th>GPA</th>
                <th>CA Marks</th>
                <th>Attendance</th>
                <th>Submission Rate</th>
                <th>LMS Engagement</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((r, i) => (
                <tr key={i}>
                  <td className="mono">{r.course_code}</td>
                  <td>{r.semester}</td>
                  <td className="mono">{r.gpa}</td>
                  <td className="mono">{r.continuous_assessment}</td>
                  <td className="mono">{r.attendance_percent}%</td>
                  <td className="mono">{r.assignment_submission_rate}%</td>
                  <td className="mono">{r.lms_engagement_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.records.length === 0 && (
            <div className="empty-state">No academic records on file yet.</div>
          )}
        </div>
      </div>

      <div className="record-card">
        <h2 className="section-title">Model Prediction</h2>
        <p className="section-note">
          This risk level comes from the trained Random Forest model, run on this student's
          averaged GPA, continuous assessment, attendance, submission rate, and LMS engagement.
          The bars below show those same inputs against their typical healthy range, for context —
          they are not the model's internal feature-importance ranking.
        </p>

        <div className="record-meta-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="meta-item">
            <span className="meta-label">Predicted Risk Probability</span>
            <span className="meta-value mono">{probabilityPct != null ? `${probabilityPct}%` : "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Predicted Category</span>
            <span className="meta-value mono">{risk}</span>
          </div>
        </div>

        <div className="factor-list">
          <div className="factor-row">
            <span>GPA</span>
            <div className="factor-bar-track">
              <div
                className={`factor-bar-fill tone-${data.avg_gpa < 2.5 ? "high" : data.avg_gpa < 3.0 ? "moderate" : "low"}`}
                style={{ width: `${Math.min((data.avg_gpa / 4) * 100, 100)}%` }}
              />
            </div>
            <span className="mono">{data.avg_gpa ?? "—"} / 4.0</span>
          </div>
          <div className="factor-row">
            <span>Attendance</span>
            <div className="factor-bar-track">
              <div
                className={`factor-bar-fill tone-${data.avg_attendance < 65 ? "high" : data.avg_attendance < 75 ? "moderate" : "low"}`}
                style={{ width: `${Math.min(data.avg_attendance, 100)}%` }}
              />
            </div>
            <span className="mono">{data.avg_attendance ?? "—"}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDetail;