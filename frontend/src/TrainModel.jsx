import { useState } from "react";
import "./TrainModel.css";

function TrainModel({ onClose, onTrained }) {
  const [file, setFile] = useState(null);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setResult(null);
    setError(null);
  };

  const handleTrain = async () => {
    if (!file) return;
    setTraining(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/train", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Training failed");

      setResult(data);
      onTrained?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setTraining(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("This clears all historical training data and the trained model. Continue?")) return;
    try {
      await fetch("http://127.0.0.1:5000/api/train/reset", { method: "POST" });
      setResult(null);
      onTrained?.();
    } catch (err) {
      setError("Failed to reset: " + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Train Risk Model</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="modal-note">
          Upload historical student data with a known outcome column:{" "}
          <span className="mono">student_number, gpa, continuous_assessment,
          attendance_percent, assignment_submission_rate, lms_engagement_score, outcome</span>.
          <br />
          <span className="mono">outcome</span> = 1 if the student was at-risk/failed, 0 otherwise.
        </p>

        {!training && (
          <>
            <input type="file" accept=".csv" onChange={handleFileChange} className="file-input" />
            <div className="train-actions">
              <button className="train-btn" onClick={handleTrain} disabled={!file}>
                Train Model
              </button>
              <button className="reset-btn" onClick={handleReset}>
                Reset Model
              </button>
            </div>
          </>
        )}

        {training && (
          <div className="training-screen">
            <div className="training-spinner" />
            <p className="mono">Running Grid Search CV over Random Forest hyperparameters&hellip;</p>
            <p className="training-sub">This performs real cross-validated hyperparameter tuning — usually 30&ndash;60 seconds.</p>
          </div>
        )}

        {error && <div className="upload-error">{error}</div>}

        {result && (
          <div className="training-result">
            <h3>Training Complete</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Accuracy</span>
                <span className="metric-value">{(result.metrics.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">F1 Score</span>
                <span className="metric-value">{(result.metrics.f1_score * 100).toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Recall</span>
                <span className="metric-value">{(result.metrics.recall * 100).toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">AUC</span>
                <span className="metric-value">
                  {result.metrics.auc != null ? (result.metrics.auc * 100).toFixed(1) + "%" : "—"}
                </span>
              </div>
            </div>
            <p className="training-detail mono">
              Trained on {result.total_training_samples} historical records &middot;
              best params: {JSON.stringify(result.metrics.best_params)}
            </p>
            {result.row_errors?.length > 0 && (
              <p className="training-detail" style={{ color: "var(--moderate)" }}>
                {result.row_errors.length} row(s) skipped due to formatting issues.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainModel;