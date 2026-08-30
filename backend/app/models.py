from datetime import datetime
from app import db


class Student(db.Model):
    __tablename__ = "students"
    student_id = db.Column(db.Integer, primary_key=True)
    student_number = db.Column(db.String(20), unique=True, nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    program = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=True)
    enrolled_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    academic_records = db.relationship("AcademicRecord", backref="student", lazy=True)
    risk_scores = db.relationship("RiskScore", backref="student", lazy=True)
    alerts = db.relationship("Alert", backref="student", lazy=True)


class AcademicRecord(db.Model):
    __tablename__ = "academic_records"
    record_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    course_code = db.Column(db.String(20), nullable=False)
    semester = db.Column(db.String(20), nullable=False)
    gpa = db.Column(db.Float, nullable=True)
    continuous_assessment = db.Column(db.Float, nullable=True)
    attendance_percent = db.Column(db.Float, nullable=True)
    assignment_submission_rate = db.Column(db.Float, nullable=True)
    lms_engagement_score = db.Column(db.Float, nullable=True)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)


class RiskScore(db.Model):
    __tablename__ = "risk_scores"
    score_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    risk_probability = db.Column(db.Float, nullable=False)
    risk_category = db.Column(db.String(10), nullable=False)
    top_features = db.Column(db.Text, nullable=True)
    model_version = db.Column(db.String(50), nullable=True)
    scored_at = db.Column(db.DateTime, default=datetime.utcnow)


class Alert(db.Model):
    __tablename__ = "alerts"
    alert_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    lecturer_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    risk_score_id = db.Column(db.Integer, db.ForeignKey("risk_scores.score_id"), nullable=True)
    status = db.Column(db.String(20), default="Pending")
    intervention_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    acknowledged_at = db.Column(db.DateTime, nullable=True)


class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    alerts = db.relationship("Alert", backref="lecturer", lazy=True)


class AuditLog(db.Model):
    __tablename__ = "audit_log"
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class TrainingRecord(db.Model):
    __tablename__ = "training_records"
    record_id = db.Column(db.Integer, primary_key=True)
    student_number = db.Column(db.String(20), nullable=False)
    gpa = db.Column(db.Float, nullable=False)
    continuous_assessment = db.Column(db.Float, nullable=False)
    attendance_percent = db.Column(db.Float, nullable=False)
    assignment_submission_rate = db.Column(db.Float, nullable=False)
    lms_engagement_score = db.Column(db.Float, nullable=False)
    outcome = db.Column(db.Integer, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)