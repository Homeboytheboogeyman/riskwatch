import csv
import io
from datetime import date, datetime

from flask import Blueprint, request, jsonify
from app import db
from app.models import Student, AcademicRecord
from app.ml_service import predict_risk

upload_bp = Blueprint("upload", __name__, url_prefix="/api/upload")

REQUIRED_COLUMNS = [
    "student_number", "course_code", "semester",
    "gpa", "continuous_assessment", "attendance_percent",
    "assignment_submission_rate", "lms_engagement_score",
]


def parse_float(value, field_name, row_num, errors):
    """Convert a CSV cell to float, recording a row-level error instead of crashing the whole upload."""
    try:
        return float(value)
    except (TypeError, ValueError):
        errors.append(f"Row {row_num}: invalid {field_name} value '{value}'")
        return None


@upload_bp.route("", methods=["POST"])
def upload_csv():
    """
    Accept a CSV of academic records, validate each row, insert them,
    and return a summary plus fresh risk predictions for affected students.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Expected form field named 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "File must be a .csv"}), 400

    try:
        stream = io.StringIO(file.stream.read().decode("utf-8"))
    except UnicodeDecodeError:
        return jsonify({"error": "Could not read file as UTF-8 text."}), 400

    reader = csv.DictReader(stream)

    if reader.fieldnames is None:
        return jsonify({"error": "CSV appears to be empty."}), 400

    missing_columns = [c for c in REQUIRED_COLUMNS if c not in reader.fieldnames]
    if missing_columns:
        return jsonify({"error": f"Missing required columns: {', '.join(missing_columns)}"}), 400

    errors = []
    rows_processed = 0
    affected_student_ids = set()

    for row_num, row in enumerate(reader, start=2):  # start=2 accounts for the header row
        student_number = (row.get("student_number") or "").strip()
        if not student_number:
            errors.append(f"Row {row_num}: missing student_number, skipped.")
            continue

        gpa = parse_float(row.get("gpa"), "gpa", row_num, errors)
        ca = parse_float(row.get("continuous_assessment"), "continuous_assessment", row_num, errors)
        attendance = parse_float(row.get("attendance_percent"), "attendance_percent", row_num, errors)
        submission = parse_float(row.get("assignment_submission_rate"), "assignment_submission_rate", row_num, errors)
        lms = parse_float(row.get("lms_engagement_score"), "lms_engagement_score", row_num, errors)

        if None in (gpa, ca, attendance, submission, lms):
            continue  # this row already logged its specific error above

        student = Student.query.filter_by(student_number=student_number).first()

        if not student:
            full_name = (row.get("full_name") or "").strip()
            program = (row.get("program") or "").strip()
            level = (row.get("level") or "").strip()

            if not full_name or not program or not level:
                errors.append(
                    f"Row {row_num}: student_number '{student_number}' not found, and "
                    f"full_name/program/level were not all provided to create a new student."
                )
                continue

            student = Student(
                student_number=student_number,
                full_name=full_name,
                program=program,
                level=level,
                enrolled_date=date.today(),
                is_active=True,
            )
            db.session.add(student)
            db.session.flush()  # assigns student.student_id before we use it below

        record = AcademicRecord(
            student_id=student.student_id,
            course_code=row.get("course_code", "").strip(),
            semester=row.get("semester", "").strip(),
            gpa=gpa,
            continuous_assessment=ca,
            attendance_percent=attendance,
            assignment_submission_rate=submission,
            lms_engagement_score=lms,
            recorded_at=datetime.utcnow(),
        )
        db.session.add(record)
        affected_student_ids.add(student.student_id)
        rows_processed += 1

    db.session.commit()

    # Recompute predictions for every student touched by this upload
    results = []
    for student_id in affected_student_ids:
        student = Student.query.get(student_id)
        records = AcademicRecord.query.filter_by(student_id=student_id).all()
        n = len(records)
        avg_gpa = sum(r.gpa for r in records if r.gpa is not None) / n
        avg_ca = sum(r.continuous_assessment for r in records if r.continuous_assessment is not None) / n
        avg_attendance = sum(r.attendance_percent for r in records if r.attendance_percent is not None) / n
        avg_submission = sum(r.assignment_submission_rate for r in records if r.assignment_submission_rate is not None) / n
        avg_lms = sum(r.lms_engagement_score for r in records if r.lms_engagement_score is not None) / n

        probability, category = predict_risk(avg_gpa, avg_ca, avg_attendance, avg_submission, avg_lms)

        results.append({
            "student_id": student.student_id,
            "student_number": student.student_number,
            "full_name": student.full_name,
            "avg_gpa": round(avg_gpa, 2),
            "avg_attendance": round(avg_attendance, 2),
            "risk_probability": probability,
            "risk_category": category,
        })

    results.sort(key=lambda r: r["risk_probability"], reverse=True)

    return jsonify({
        "rows_processed": rows_processed,
        "errors": errors,
        "affected_students": results,
    })