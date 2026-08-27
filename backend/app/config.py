import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration loaded from environment variables."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-fallback-key")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False