from flask import Blueprint, jsonify
from app.models import Student, AcademicRecord
from app import db
from app.ml_service import predict_risk

students_bp = Blueprint("students", __name__, url_prefix="/api/students")


def compute_averages(records):
    """Average the five model features across a student's academic records."""
    if not records:
        return None
    n = len(records)
    return {
        "gpa": sum(r.gpa for r in records if r.gpa is not None) / n,
        "continuous_assessment": sum(r.continuous_assessment for r in records if r.continuous_assessment is not None) / n,
        "attendance_percent": sum(r.attendance_percent for r in records if r.attendance_percent is not None) / n,
        "assignment_submission_rate": sum(r.assignment_submission_rate for r in records if r.assignment_submission_rate is not None) / n,
        "lms_engagement_score": sum(r.lms_engagement_score for r in records if r.lms_engagement_score is not None) / n,
    }


@students_bp.route("/", methods=["GET"])
def get_students():
    """Return all students with their average metrics and a real model-based risk prediction."""
    students = Student.query.all()
    result = []
    for s in students:
        records = AcademicRecord.query.filter_by(student_id=s.student_id).all()
        avgs = compute_averages(records)

        if avgs:
            probability, category = predict_risk(
                avgs["gpa"],
                avgs["continuous_assessment"],
                avgs["attendance_percent"],
                avgs["assignment_submission_rate"],
                avgs["lms_engagement_score"],
            )
        else:
            probability, category = None, "Unknown"

        result.append({
            "student_id": s.student_id,
            "student_number": s.student_number,
            "full_name": s.full_name,
            "program": s.program,
            "level": s.level,
            "avg_gpa": round(avgs["gpa"], 2) if avgs else None,
            "avg_attendance": round(avgs["attendance_percent"], 2) if avgs else None,
            "risk_probability": probability,
            "risk_category": category,
        })
    return jsonify(result)


@students_bp.route("/<int:student_id>", methods=["GET"])
def get_student_detail(student_id):
    """Return full detail for one student, including the real model prediction."""
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    records = AcademicRecord.query.filter_by(student_id=student_id).order_by(AcademicRecord.recorded_at).all()

    record_list = [{
        "course_code": r.course_code,
        "semester": r.semester,
        "gpa": r.gpa,
        "continuous_assessment": r.continuous_assessment,
        "attendance_percent": r.attendance_percent,
        "assignment_submission_rate": r.assignment_submission_rate,
        "lms_engagement_score": r.lms_engagement_score,
        "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
    } for r in records]

    avgs = compute_averages(records)
    if avgs:
        probability, category = predict_risk(
            avgs["gpa"],
            avgs["continuous_assessment"],
            avgs["attendance_percent"],
            avgs["assignment_submission_rate"],
            avgs["lms_engagement_score"],
        )
    else:
        probability, category = None, "Unknown"

    return jsonify({
        "student_id": student.student_id,
        "student_number": student.student_number,
        "full_name": student.full_name,
        "program": student.program,
        "level": student.level,
        "email": student.email,
        "enrolled_date": student.enrolled_date.isoformat() if student.enrolled_date else None,
        "avg_gpa": round(avgs["gpa"], 2) if avgs else None,
        "avg_attendance": round(avgs["attendance_percent"], 2) if avgs else None,
        "risk_probability": probability,
        "risk_category": category,
        "records": record_list,
    })