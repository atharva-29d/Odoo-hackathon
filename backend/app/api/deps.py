from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import ApiError
from app.core.security import verify_firebase_token
from app.services.reimbursement_service import get_company_by_id, get_user_by_id

security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    if credentials is None or not credentials.credentials:
        raise ApiError(401, "Authentication required")

    token_data = verify_firebase_token(credentials.credentials)
    user_id = token_data.get("uid")
    if not user_id:
        raise ApiError(401, "Invalid Firebase session")
    user = get_user_by_id(user_id)

    if not user or not user.get("is_active", True):
        raise ApiError(401, "User session is no longer valid")

    company = get_company_by_id(user["company_id"])
    if not company:
        raise ApiError(401, "Associated company was not found")

    user["company"] = company
    return user


def require_roles(*roles: str):
    def role_dependency(current_user=Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise ApiError(403, "You do not have access to this resource")
        return current_user

    return role_dependency
