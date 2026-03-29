import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings:
    def __init__(self) -> None:
        self.app_name = os.getenv("APP_NAME", "Reimbursement API")
        self.client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
        self.firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()
        self.firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
        self.firebase_web_api_key = os.getenv("FIREBASE_WEB_API_KEY", "").strip()
        self.rest_countries_api_url = os.getenv("REST_COUNTRIES_API_URL", "https://restcountries.com/v3.1").strip()
        self.exchange_rate_api_url = os.getenv("EXCHANGE_RATE_API_URL", "https://api.frankfurter.app").strip()
        self.tesseract_cmd = os.getenv("TESSERACT_CMD", "").strip()
        self.tesseract_lang = os.getenv("TESSERACT_LANG", "eng").strip()
        self.upload_dir = str(BASE_DIR / "uploads")
        self.host = os.getenv("HOST", "127.0.0.1")
        self.port = int(os.getenv("PORT", "5000"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
