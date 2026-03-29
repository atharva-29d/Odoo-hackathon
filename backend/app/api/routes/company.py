from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.models.schemas import UpdateCompanySettingsRequest
from app.services.reimbursement_service import (
    get_company_settings_for_actor,
    list_audit_logs_for_actor,
    update_company_settings,
)

router = APIRouter()


@router.get("/settings")
def get_company_settings(current_user=Depends(require_roles("admin"))):
    return {
        "data": get_company_settings_for_actor(current_user),
    }


@router.put("/settings")
def put_company_settings(payload: UpdateCompanySettingsRequest, current_user=Depends(require_roles("admin"))):
    return {
        "message": "Company settings updated successfully",
        "data": update_company_settings(current_user, payload.model_dump()),
    }


@router.get("/audit-logs")
def get_audit_logs(current_user=Depends(require_roles("admin"))):
    return {
        "data": list_audit_logs_for_actor(current_user),
    }
