import json
from urllib import error, request

from firebase_admin import auth as firebase_admin_auth

from app.core.config import get_settings
from app.core.exceptions import ApiError
from app.core.firebase import get_firebase_auth
import os

API_KEY = os.getenv("FIREBASE_WEB_API_KEY")

def _identity_toolkit_url(path: str) -> str:
    settings = get_settings()
    if not settings.firebase_web_api_key:
        raise ApiError(500, "FIREBASE_WEB_API_KEY is required for Firebase Authentication sign-in")
    return f"https://identitytoolkit.googleapis.com/v1/{path}?key={settings.firebase_web_api_key}"


def _post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, headers={"Content-Type": "application/json"})

    try:
        with request.urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="ignore")
        try:
            response_json = json.loads(response_body)
            message = response_json.get("error", {}).get("message", "Authentication request failed")
        except json.JSONDecodeError:
            message = response_body or "Authentication request failed"
        raise ApiError(exc.code, _map_firebase_auth_error(message)) from exc
    except error.URLError as exc:
        raise ApiError(503, "Unable to reach Firebase Authentication. Check your internet connection and API key.") from exc


def _map_firebase_auth_error(message: str) -> str:
    normalized = (message or "").upper()
    mapping = {
        "EMAIL_EXISTS": "A user with this email already exists",
        "INVALID_PASSWORD": "Invalid email or password",
        "EMAIL_NOT_FOUND": "Invalid email or password",
        "USER_DISABLED": "This account has been disabled",
        "INVALID_LOGIN_CREDENTIALS": "Invalid email or password",
    }
    return mapping.get(normalized, message.replace("_", " ").capitalize() if normalized else "Authentication failed")


def create_firebase_user(email: str, password: str, display_name: str):
    firebase_auth = get_firebase_auth()
    try:
        return firebase_auth.create_user(email=email, password=password, display_name=display_name)
    except firebase_admin_auth.EmailAlreadyExistsError as exc:
        raise ApiError(409, "A user with this email already exists") from exc
    except ValueError as exc:
        raise ApiError(400, str(exc)) from exc


def delete_firebase_user(uid: str):
    firebase_auth = get_firebase_auth()
    try:
        firebase_auth.delete_user(uid)
    except firebase_admin_auth.UserNotFoundError:
        return


def delete_firebase_user_by_email(email: str):
    firebase_auth = get_firebase_auth()
    try:
        user = firebase_auth.get_user_by_email(email)
    except firebase_admin_auth.UserNotFoundError:
        return
    firebase_auth.delete_user(user.uid)


def verify_firebase_token(token: str) -> dict:
    firebase_auth = get_firebase_auth()
    try:
        return firebase_auth.verify_id_token(token)
    except Exception as exc:  # noqa: BLE001
        raise ApiError(401, "Invalid or expired Firebase session") from exc


def sign_in_with_email_password(email: str, password: str) -> dict:
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }
    return _post_json(_identity_toolkit_url("accounts:signInWithPassword"), payload)
