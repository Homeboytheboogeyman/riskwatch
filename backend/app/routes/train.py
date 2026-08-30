import csv
import io

from flask import Blueprint, request, jsonify
from app import db
from app.models import TrainingRecord
from app.ml_training import train_model, model_exists, reset_model
from app.ml_service import load_model  # noqa: F401 (imported to trigger reload on next predict call)
import app.ml_service as ml_service

train_bp = Blueprint("train", __name__, url_prefix="/api/train")

REQUIRED_COLUMNS = [
    "student_number", "gpa", "continuous_assessment",
    "attendance_percent", "assignment_submission_rate",
    "lms_engagement_score", "outcome",
]


@train_bp.route("/status", methods=["GET"])
def status():
    """Tells the frontend whether a trained model currently exists."""
    return jsonify({"model_trained": model_exists()})


@train_bp.route("", methods=["POST"])
def train():
    """Accept historical CSV, store rows, run training pipeline, return metrics."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "File must be a .csv"}), 400

    stream = io.StringIO(file.stream.read().decode("utf-8"))
    reader = csv.DictReader(stream)

    if reader.fieldnames is None:
        return jsonify({"error": "CSV appears to be empty."}), 400

    missing = [c for c in REQUIRED_COLUMNS if c not in reader.fieldnames]
    if missing:
        return jsonify({"error": f"Missing required columns: {', '.join(missing)}"}), 400

    errors = []
    new_records = []

    for row_num, row in enumerate(reader, start=2):
        try:
            record = TrainingRecord(
                student_number=(row.get("student_number") or "").strip(),
                gpa=float(row["gpa"]),
                continuous_assessment=float(row["continuous_assessment"]),
                attendance_percent=float(row["attendance_percent"]),
                assignment_submission_rate=float(row["assignment_submission_rate"]),
                lms_engagement_score=float(row["lms_engagement_score"]),
                outcome=int(row["outcome"]),
            )
        except (ValueError, KeyError) as e:
            errors.append(f"Row {row_num}: {e}")
            continue
        db.session.add(record)
        new_records.append(record)

    if not new_records:
        return jsonify({"error": "No valid rows to train on.", "row_errors": errors}), 400

    db.session.commit()

    # Train on ALL training_records ever uploaded, not just this batch,
    # so repeated uploads accumulate a bigger historical dataset.
    all_records = TrainingRecord.query.all()

    try:
        metrics = train_model(all_records)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    ml_service._model = None  # force ml_service to reload the freshly trained model
    ml_service._scaler = None

    return jsonify({
        "rows_processed": len(new_records),
        "row_errors": errors,
        "total_training_samples": len(all_records),
        "metrics": metrics,
    })


@train_bp.route("/reset", methods=["POST"])
def reset():
    """Clear all historical training data and delete the trained model files."""
    TrainingRecord.query.delete()
    db.session.commit()
    reset_model()
    ml_service._model = None
    ml_service._scaler = None
    return jsonify({"message": "Training data and model cleared."})