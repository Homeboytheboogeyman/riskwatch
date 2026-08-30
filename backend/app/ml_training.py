

import os
import joblib
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score, f1_score, recall_score, roc_auc_score
from imblearn.over_sampling import SMOTE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "ml_models", "random_forest_risk_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "..", "ml_models", "scaler.pkl")

FEATURES = ["gpa", "continuous_assessment", "attendance_percent",
            "assignment_submission_rate", "lms_engagement_score"]


def train_model(training_records):
    """
    training_records: list of TrainingRecord ORM objects.
    Runs SMOTE + Grid Search CV over Random Forest hyperparameters,
    saves the best model + scaler, returns evaluation metrics.
    """
    X = np.array([[getattr(r, f) for f in FEATURES] for r in training_records])
    y = np.array([r.outcome for r in training_records])

    if len(set(y)) < 2:
        raise ValueError("Training data needs both at-risk (1) and not-at-risk (0) outcomes.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # k_neighbors capped below the smallest class size to avoid SMOTE errors on small datasets
    minority_count = min(sum(y_train == 0), sum(y_train == 1))
    k = max(1, min(3, minority_count - 1)) if minority_count > 1 else 1
    smote = SMOTE(random_state=42, k_neighbors=k)
    X_train_res, y_train_res = smote.fit_resample(X_train_scaled, y_train)

    # Grid Search CV: this is the part that gives real ~30-60s of genuine
    # compute time while also legitimately tuning the model, rather than
    # faking a delay with time.sleep().
    param_grid = {
        "n_estimators": [100, 200, 300],
        "max_depth": [10, 20, None],
        "min_samples_split": [2, 5, 10],
    }
    grid = GridSearchCV(
        RandomForestClassifier(random_state=42),
        param_grid,
        cv=3,
        scoring="f1",
        n_jobs=-1,
    )
    grid.fit(X_train_res, y_train_res)
    best_model = grid.best_estimator_

    y_pred = best_model.predict(X_test_scaled)
    y_proba = best_model.predict_proba(X_test_scaled)[:, 1]

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "auc": round(roc_auc_score(y_test, y_proba), 4) if len(set(y_test)) > 1 else None,
        "best_params": grid.best_params_,
        "training_samples": len(training_records),
    }

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    return metrics


def model_exists():
    return os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH)


def reset_model():
    for path in (MODEL_PATH, SCALER_PATH):
        if os.path.exists(path):
            os.remove(path)