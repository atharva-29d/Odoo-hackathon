from pathlib import Path
import firebase_admin
from firebase_admin import auth, credentials, firestore

from app.core.config import get_settings
from app.core.exceptions import ApiError

# Base directory → backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent


def get_firebase_app():
    # Check if default app already exists
    try:
        return firebase_admin.get_app()
    except ValueError:
        pass  # App not initialized yet

    settings = get_settings()
    options = {}

    # Optional: project ID
    

    # Path to firebase.json
    credentials_path = BASE_DIR / "firebase.json"

    print("PATH:", credentials_path)
    print("EXISTS:", credentials_path.exists())

    # Check if file exists
    if not credentials_path.exists():
        raise ApiError(
            500,
            f"Firebase credentials file was not found at {credentials_path}"
        )

    # Load credentials
    cred = credentials.Certificate(str(credentials_path))

    # Initialize Firebase (DEFAULT APP)
    return firebase_admin.initialize_app(cred, options=options or None)


def get_firestore_client():
    get_firebase_app()
    return firestore.client()


def get_firebase_auth():
    get_firebase_app()
    return auth