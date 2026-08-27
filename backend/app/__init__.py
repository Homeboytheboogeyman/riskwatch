from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from app.config import Config

db = SQLAlchemy()

def create_app():
    """Application factory: builds and configures the Flask app instance."""
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app)  # allows the React frontend (different port) to call this API

    with app.app_context():
        from app import models  # ensures models are registered before any db operations

    from app.routes.students import students_bp
    app.register_blueprint(students_bp)

    from app.routes.upload import upload_bp
    app.register_blueprint(upload_bp)

    return app