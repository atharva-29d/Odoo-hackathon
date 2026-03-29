from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_current_user
from app.models.schemas import CreateExpenseRequest
from app.services.ocr_service import extract_receipt_data, save_receipt_file
from app.services.reimbursement_service import create_expense_record, list_company_expenses_for_actor, list_my_expenses

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
