import { useState } from "react";
import TrainModel from "./TrainModel";
import UploadModal from "./UploadModal";
import "./SetupGate.css";

function SetupGate({ modelTrained, studentCount, onRefresh }) {
  const [showTrain, setShowTrain] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const step = !modelTrained ? 1 : 2;

  return (
    <div className="setup-gate">
      <div className="setup-card">
        <h1>Get RiskWatch Ready</h1>
        <p className="setup-sub">Two quick steps before you can see predictions.</p>

        <div className="setup-steps">
          <div className={`setup-step ${step === 1 ? "active" : "done"}`}>
            <div className="step-number">{modelTrained ? "✓" : "1"}</div>
            <div className="step-body">
              <h2>Train the Risk Model</h2>
              <p>Upload historical student data (with known outcomes) so the model can learn.</p>
              {!modelTrained && (
                <button className="setup-btn" onClick={() => setShowTrain(true)}>
                  Train Model
                </button>
              )}
              {modelTrained && <span className="step-done-label">Model trained</span>}
            </div>
          </div>

          <div className={`setup-step ${step === 2 ? "active" : modelTrained ? "" : "locked"}`}>
            <div className="step-number">{studentCount > 0 ? "✓" : "2"}</div>
            <div className="step-body">
              <h2>Upload Current Students</h2>
              <p>Upload your class's current data to get real risk predictions.</p>
              {modelTrained && studentCount === 0 && (
                <button className="setup-btn" onClick={() => setShowUpload(true)}>
                  Upload CSV
                </button>
              )}
              {!modelTrained && <span className="step-locked-label">Train the model first</span>}
              {studentCount > 0 && <span className="step-done-label">{studentCount} students loaded</span>}
            </div>
          </div>
        </div>
      </div>

      {showTrain && (
        <TrainModel onClose={() => setShowTrain(false)} onTrained={onRefresh} />
      )}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploadComplete={onRefresh} />
      )}
    </div>
  );
}

export default SetupGate;