from fastapi import APIRouter, Depends, File, Query, Response, UploadFile

from app.api.deps import get_current_user
from app.core.exceptions import ApiError
from app.models.schemas import ApprovalActionRequest, CreateExpenseRequest
from app.services.ocr_service import extract_receipt_data, save_receipt_file
from app.services.reimbursement_service import (
    create_expense_record,
    build_expense_report,
    get_pending_expense_queue,
    list_company_expenses_for_actor,
    list_my_expenses,
    process_expense_action,
)
from pathlib import Path

router = APIRouter()


@router.post("")
def create_expense(payload: CreateExpenseRequest, current_user=Depends(get_current_user)):
    expense = create_expense_record(current_user, payload.model_dump())
    return {
        "message": "Expense submitted successfully",
        "data": expense,
    }


@router.get("/my")
def get_my_expenses(current_user=Depends(get_current_user)):
    return {
        "data": list_my_expenses(current_user),
    }


@router.get("")
def get_expenses(current_user=Depends(get_current_user)):
    return {
        "data": list_company_expenses_for_actor(current_user),
    }


@router.get("/report")
def download_expense_report(
    scope: str | None = Query(default=None),
    current_user=Depends(get_current_user),
):
    report = build_expense_report(current_user, scope=scope)
    return Response(
        content=report["content"],
        media_type="text/csv",
        headers={
          "Content-Disposition": f'attachment; filename="{report["filename"]}"'
        },
    )


@router.get("/pending")
def get_pending_expenses(current_user=Depends(get_current_user)):
    return {
        "data": get_pending_expense_queue(current_user),
    }


@router.post("/{expense_id}/approve")
def approve_expense(expense_id: str, payload: ApprovalActionRequest, current_user=Depends(get_current_user)):
    return {
        "message": "Expense approved successfully",
        "data": process_expense_action(current_user, expense_id, "approve", payload.comment.strip()),
    }


@router.post("/{expense_id}/reject")
def reject_expense(expense_id: str, payload: ApprovalActionRequest, current_user=Depends(get_current_user)):
    if not payload.comment.strip():
        raise ApiError(400, "A rejection comment is required")
    return {
        "message": "Expense rejected successfully",
        "data": process_expense_action(current_user, expense_id, "reject", payload.comment.strip()),
    }


@router.post("/ocr")
async def run_ocr(receipt: UploadFile = File(...), current_user=Depends(get_current_user)):
    _ = current_user
    file_path = await save_receipt_file(receipt)
    extracted = extract_receipt_data(file_path)
    return {
        "message": "Receipt scanned successfully",
        "data": {
            "receiptImagePath": f"/uploads/{Path(file_path).name}",
            **extracted,
        },
    }
