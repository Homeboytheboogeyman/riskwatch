import { useState } from "react";
import "./UploadModal.css";

const MIN_LOADING_MS = 2500;

function UploadModal({ onClose, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    const startTime = Date.now();

    try {
      const res = await fetch("http://127.0.0.1:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Enforce a minimum loading duration so scoring reads as real work,
      // not an instant/fake response, even when the request itself is fast.
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS - elapsed));
      }

      setResult(data);
      onUploadComplete?.(); // tell the parent to refetch the student list
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Class Data</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-note">
          Upload a CSV with columns: <span className="mono">student_number, full_name,
          program, level, course_code, semester, gpa, continuous_assessment,
          attendance_percent, assignment_submission_rate, lms_engagement_score</span>.
          Existing students are matched by student number; new ones are created automatically.
        </p>

        {!uploading && (
          <>
            <input type="file" accept=".csv" onChange={handleFileChange} className="file-input" />
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={!file}
            >
              Upload and Score
            </button>
          </>
        )}

        {uploading && (
          <div className="training-screen">
            <div className="training-spinner" />
            <p className="mono">Scoring students against the trained model&hellip;</p>
          </div>
        )}

        {error && <div className="upload-error">{error}</div>}

        {result && (
          <div className="upload-result">
            <div className="result-summary">
              <span className="mono">{result.rows_processed} records processed</span>
              {result.errors.length > 0 && (
                <span className="mono result-error-count">
                  {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped
                </span>
              )}
            </div>

            {result.errors.length > 0 && (
              <details className="error-details">
                <summary>View skipped rows</summary>
                <ul>
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}

            {result.affected_students.length > 0 && (
              <div className="result-students">
                <h3>Predicted Risk for Uploaded Students</h3>
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>Student #</th>
                      <th>Name</th>
                      <th>Avg GPA</th>
                      <th>Avg Attendance</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.affected_students.map((s) => (
                      <tr key={s.student_id}>
                        <td className="mono">{s.student_number}</td>
                        <td>{s.full_name}</td>
                        <td className="mono">{s.avg_gpa}</td>
                        <td className="mono">{s.avg_attendance}%</td>
                        <td>
                          <span className={`risk-pill tone-${s.risk_category.toLowerCase()}`}>
                            {s.risk_category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadModal;