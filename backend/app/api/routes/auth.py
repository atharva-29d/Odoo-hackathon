from fastapi import APIRouter

from app.models.schemas import LoginRequest, SignupRequest
from app.services.reimbursement_service import create_company_and_admin, login_user

router = APIRouter()


@router.post("/signup")
def signup(payload: SignupRequest):
    session = create_company_and_admin(payload.model_dump())
    return {
        "message": "Company and admin account created successfully",
        "data": session,
    }


@router.post("/login")
def login(payload: LoginRequest):
    session = login_user(payload.model_dump())
    return {
        "message": "Login successful",
        "data": session,
    }
