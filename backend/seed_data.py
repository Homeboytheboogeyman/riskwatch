"""
Seed script — populates riskwatch_db with fake students, academic records,
and a couple of users for local development and ML prototyping.
Run with: python seed_data.py
"""

import random
from datetime import date, datetime, timedelta
from app import create_app, db
from app.models import Student, AcademicRecord, User

app = create_app()

FIRST_NAMES = ["Kwame", "Ama", "Kofi", "Akosua", "Yaw", "Efua", "Kwesi", "Adjoa",
               "Kojo", "Abena", "Kwabena", "Akua", "Fiifi", "Esi", "Nana", "Aba"]
LAST_NAMES = ["Mensah", "Owusu", "Boateng", "Asante", "Agyei", "Darko", "Appiah",
              "Osei", "Amoah", "Adjei", "Frimpong", "Sarpong"]
PROGRAMS = ["BSc Computer Science", "BSc Information Technology", "BSc Telecom Engineering"]
COURSES = ["CS301", "CS302", "CS310", "CS315", "CS320"]

def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def seed():
    with app.app_context():
        print("Clearing existing seed data...")
        AcademicRecord.query.delete()
        Student.query.delete()
        User.query.delete()
        db.session.commit()

        print("Creating users...")
        admin = User(
            full_name="Dr. Prince Amoako",
            email="admin@gctu.edu.gh",
            password_hash="placeholder-will-add-bcrypt-later",  # TODO: hash properly once auth is built
            role="Admin",
        )
        lecturer = User(
            full_name="Mr. Ian Dunyo",
            email="lecturer@gctu.edu.gh",
            password_hash="placeholder-will-add-bcrypt-later",
            role="Lecturer",
        )
        db.session.add_all([admin, lecturer])
        db.session.commit()

        print("Creating 60 fake students with academic records...")
        students = []
        for i in range(60):
            student = Student(
                student_number=f"GCTU-{2023000 + i}",
                full_name=random_name(),
                program=random.choice(PROGRAMS),
                level=random.choice(["200", "300", "400"]),
                email=f"student{i}@gctu.edu.gh",
                enrolled_date=date(2023, 9, 1),
                is_active=True,
            )
            students.append(student)
        db.session.add_all(students)
        db.session.commit()

        # Deliberately skew some students toward "at-risk" profiles so the
        # ML model later has a meaningful signal to learn from, not just noise.
        for student in students:
            is_at_risk_profile = random.random() < 0.25  # ~25% at-risk students

            for course in random.sample(COURSES, k=random.randint(2, 4)):
                if is_at_risk_profile:
                    gpa = round(random.uniform(1.0, 2.3), 2)
                    ca = round(random.uniform(20, 45), 1)
                    attendance = round(random.uniform(30, 60), 1)
                    submission = round(random.uniform(20, 55), 1)
                    lms = round(random.uniform(10, 40), 1)
                else:
                    gpa = round(random.uniform(2.5, 4.0), 2)
                    ca = round(random.uniform(50, 95), 1)
                    attendance = round(random.uniform(65, 100), 1)
                    submission = round(random.uniform(60, 100), 1)
                    lms = round(random.uniform(40, 95), 1)

                record = AcademicRecord(
                    student_id=student.student_id,
                    course_code=course,
                    semester="2025/2026 Semester 1",
                    gpa=gpa,
                    continuous_assessment=ca,
                    attendance_percent=attendance,
                    assignment_submission_rate=submission,
                    lms_engagement_score=lms,
                    recorded_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                )
                db.session.add(record)

        db.session.commit()
        print("Done. 60 students seeded with academic records.")

if __name__ == "__main__":
    seed()