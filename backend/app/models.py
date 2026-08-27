from datetime import datetime
from app import db


class Student(db.Model):
    """Core student record — one row per enrolled student."""
    __tablename__ = "students"

    student_id = db.Column(db.Integer, primary_key=True)
    student_number = db.Column(db.String(20), unique=True, nullable=False)  # e.g. matriculation number
    full_name = db.Column(db.String(150), nullable=False)
    program = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(10), nullable=False)  # e.g. "300", "400"
    email = db.Column(db.String(150), unique=True, nullable=True)
    enrolled_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    academic_records = db.relationship("AcademicRecord", backref="student", lazy=True)
    risk_scores = db.relationship("RiskScore", backref="student", lazy=True)
    alerts = db.relationship("Alert", backref="student", lazy=True)


class AcademicRecord(db.Model):
    """One row per student per course per semester — raw features for the ML model."""
    __tablename__ = "academic_records"

    record_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    course_code = db.Column(db.String(20), nullable=False)
    semester = db.Column(db.String(20), nullable=False)  # e.g. "2025/2026 Semester 1"
    gpa = db.Column(db.Float, nullable=True)
    continuous_assessment = db.Column(db.Float, nullable=True)  # CA marks
    attendance_percent = db.Column(db.Float, nullable=True)
    assignment_submission_rate = db.Column(db.Float, nullable=True)
    lms_engagement_score = db.Column(db.Float, nullable=True)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)


class RiskScore(db.Model):
    """Model output — one row per scoring run per student."""
    __tablename__ = "risk_scores"

    score_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    risk_probability = db.Column(db.Float, nullable=False)  # 0.0 - 1.0
    risk_category = db.Column(db.String(10), nullable=False)  # "High" / "Moderate" / "Low"
    top_features = db.Column(db.Text, nullable=True)  # JSON string of feature importances
    model_version = db.Column(db.String(50), nullable=True)
    scored_at = db.Column(db.DateTime, default=datetime.utcnow)


class Alert(db.Model):
    """Notification generated for High Risk students, routed to a lecturer."""
    __tablename__ = "alerts"

    alert_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    risk_score_id = db.Column(db.Integer, db.ForeignKey("risk_scores.score_id"), nullable=True)
    status = db.Column(db.String(20), default="Pending")  # Pending / Acknowledged / Resolved
    intervention_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    acknowledged_at = db.Column(db.DateTime, nullable=True)


class User(db.Model):
    """System users: Admin, Lecturer, Viewer roles."""
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)  # bcrypt hash, never plaintext
    role = db.Column(db.String(20), nullable=False)  # "Admin" / "Lecturer" / "Viewer"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    alerts = db.relationship("Alert", backref="lecturer", lazy=True)


class AuditLog(db.Model):
    """Append-only log of significant system actions."""
    __tablename__ = "audit_log"

    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    action = db.Column(db.String(255), nullable=False)  # e.g. "Uploaded academic records", "Acknowledged alert"
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class TrainingRecord(db.Model):
    """Historical student data uploaded specifically to train the risk model.
    Kept separate from live Student/AcademicRecord data since these rows
    represent past cohorts, not students currently being tracked."""
    __tablename__ = "training_records"

    record_id = db.Column(db.Integer, primary_key=True)
    student_number = db.Column(db.String(20), nullable=False)
    gpa = db.Column(db.Float, nullable=False)
    continuous_assessment = db.Column(db.Float, nullable=False)
    attendance_percent = db.Column(db.Float, nullable=False)
    assignment_submission_rate = db.Column(db.Float, nullable=False)
    lms_engagement_score = db.Column(db.Float, nullable=False)
    outcome = db.Column(db.Integer, nullable=False)  # 1 = was at-risk/failed, 0 = was not
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)