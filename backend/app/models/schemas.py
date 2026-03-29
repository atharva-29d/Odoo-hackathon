from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AppBaseModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class SignupRequest(AppBaseModel):
    company_name: str = Field(alias="companyName")
    country: str
    admin_name: str = Field(alias="adminName")
    email: str
    password: str
    approval_rule: str = Field(default="hybrid", alias="approvalRule")

    @field_validator("company_name", "country", "admin_name", "email")
    @classmethod
    def validate_text_fields(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required")
        return cleaned

    @field_validator("approval_rule")
    @classmethod
    def validate_approval_rule(cls, value: str) -> str:
        if value not in {"percentage", "specific", "hybrid"}:
            raise ValueError("Please select a valid approval rule")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.strip()) < 6:
            raise ValueError("Password must be at least 6 characters")
        return value


class LoginRequest(AppBaseModel):
    email: str
    password: str

    @field_validator("email", "password")
    @classmethod
    def validate_required(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required")
        return cleaned


class CreateUserRequest(AppBaseModel):
    name: str
    email: str
    password: str
    role: str
    manager_id: str | None = Field(default=None, alias="managerId")
    department: str = ""
    title: str = ""
    approval_roles: list[str] = Field(default_factory=list, alias="approvalRoles")

    @field_validator("name", "email")
    @classmethod
    def validate_required_fields(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_user_password(cls, value: str) -> str:
        if len(value.strip()) < 6:
            raise ValueError("Password must be at least 6 characters")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in {"admin", "manager", "employee"}:
            raise ValueError("Please select a valid role")
        return value


class OCRMetaInput(AppBaseModel):
    text: str = ""
    extracted_amount: float | None = Field(default=None, alias="extractedAmount")
    extracted_date: str = Field(default="", alias="extractedDate")
    vendor_name: str = Field(default="", alias="vendorName")


class CreateExpenseRequest(AppBaseModel):
    amount: float
    currency: str
    category: str
    description: str
    expense_date: str = Field(alias="expenseDate")
    vendor_name: str = Field(default="", alias="vendorName")
    receipt_image_path: str = Field(default="", alias="receiptImagePath")
    ocr_meta: OCRMetaInput | None = Field(default=None, alias="ocrMeta")

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(value, 2)

    @field_validator("currency", "category", "description")
    @classmethod
    def validate_expense_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required")
        return cleaned

    @field_validator("expense_date")
    @classmethod
    def validate_date(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Expense date is required")
        return value.strip()


class ApprovalActionRequest(AppBaseModel):
    comment: str = ""


class ReceiptOCRResponse(AppBaseModel):
    receipt_image_path: str = Field(alias="receiptImagePath")
    text: str
    extracted_amount: float | None = Field(default=None, alias="extractedAmount")
    extracted_date: str = Field(default="", alias="extractedDate")
    vendor_name: str = Field(default="", alias="vendorName")


class FirestoreDocument(BaseModel):
    id: str
    data: dict[str, Any]
