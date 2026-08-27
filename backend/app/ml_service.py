"""
Loads the trained Random Forest model and scaler once at startup,
and exposes a function to score a student's features into a risk prediction.
"""

import os
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "random_forest_risk_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "ml_models", "scaler.pkl")

_model = None
_scaler = None


def load_model():
    """Load the model and scaler into memory once, reused across requests."""
    global _model, _scaler
    if _model is None:
        _model = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
    return _model, _scaler


def predict_risk(gpa, continuous_assessment, attendance_percent, submission_rate, lms_engagement):
    """
    Run the trained Random Forest on one student's averaged features.
    Returns (risk_probability, risk_category).
    Feature order MUST match training order: gpa, continuous_assessment,
    attendance_percent, assignment_submission_rate, lms_engagement_score.
    """
    model, scaler = load_model()

    features = [[gpa, continuous_assessment, attendance_percent, submission_rate, lms_engagement]]
    features_scaled = scaler.transform(features)

    probability = model.predict_proba(features_scaled)[0][1]  # probability of class "1" (at-risk)

    if probability > 0.65:
        category = "High"
    elif probability > 0.35:
        category = "Moderate"
    else:
        category = "Low"

    return round(float(probability), 4), category