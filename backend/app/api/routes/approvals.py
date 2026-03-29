from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.exceptions import ApiError
from app.models.schemas import ApprovalActionRequest
from app.services.reimbursement_service import list_pending_approvals, process_approval_action

router = APIRouter()


@router.get("/pending")
def get_pending_approvals(current_user=Depends(get_current_user)):
    return {
        "data": list_pending_approvals(current_user),
    }


@router.post("/{approval_id}/approve")
def approve_expense(
    approval_id: str,
    payload: ApprovalActionRequest,
    current_user=Depends(get_current_user),
):
    result = process_approval_action(current_user, approval_id, "approve", payload.comment.strip())
    return {
        "message": "Approval completed",
        "data": result,
    }


@router.post("/{approval_id}/reject")
def reject_expense(
    approval_id: str,
    payload: ApprovalActionRequest,
    current_user=Depends(get_current_user),
):
    if not payload.comment.strip():
        raise ApiError(400, "A rejection comment is required")

    result = process_approval_action(current_user, approval_id, "reject", payload.comment.strip())
    return {
        "message": "Expense rejected",
        "data": result,
    }
