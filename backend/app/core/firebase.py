import os
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import get_settings

_firebase_app: Optional[firebase_admin.App] = None


def get_firestore_client():
    global _firebase_app

    if _firebase_app is None:
        settings = get_settings()
        credential_path = settings.firebase_credentials_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()

        if not credential_path:
            raise RuntimeError(
                "Firebase credentials are not configured. Set FIREBASE_CREDENTIALS_PATH or GOOGLE_APPLICATION_CREDENTIALS."
            )

        options = {}
        if settings.firebase_project_id:
            options["projectId"] = settings.firebase_project_id

        credential = credentials.Certificate(credential_path)
        _firebase_app = firebase_admin.initialize_app(credential, options or None)

    return firestore.client(_firebase_app)
