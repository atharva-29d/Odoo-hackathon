from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.models.schemas import CreateUserRequest
from app.services.reimbursement_service import create_user_record, list_users_for_actor

router = APIRouter()


@router.get("")
def get_users(current_user=Depends(require_roles("admin"))):
    return {
        "data": list_users_for_actor(current_user),
    }


@router.post("")
def create_user(payload: CreateUserRequest, current_user=Depends(require_roles("admin"))):
    user = create_user_record(current_user, payload.model_dump())
    return {
        "message": "User created successfully",
        "data": user,
    }
